<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OltDevice;
use FreeDSx\Snmp\SnmpClient;

class OltController extends Controller
{
    public function getSystemStats($id)
    {
        $olt = OltDevice::findOrFail($id);

        try {
            $snmp = new SnmpClient([
                'host' => $olt->ip,
                'version' => 2,
                'community' => $olt->snmp_community ?: 'public',
                'port' => $olt->port ?: 161,
                'timeout' => 3,
                'retries' => 1,
            ]);

            // Get standard Uptime
            $sysUpTimeObj = $snmp->get('1.3.6.1.2.1.1.3.0');
            $sysUpTimeTicks = 0;
            if ($sysUpTimeObj && count($sysUpTimeObj) > 0 && $sysUpTimeObj->first()->getValue() !== null) {
                $sysUpTimeTicks = (int) $sysUpTimeObj->first()->getValue()->getValue();
            }
            
            $uptimeSeconds = floor($sysUpTimeTicks / 100);
            $days = floor($uptimeSeconds / 86400);
            $hours = floor(($uptimeSeconds % 86400) / 3600);
            $uptimeFormat = $days . 'd ' . $hours . 'h';

            // Attempt to get ZTE specific CPU load, Memory, Temp
            $cpuUsage = 0;
            $memUsage = 0;
            $temperature = 0;

            try {
                // Try ZTE C300 specific OIDs found via snmpwalk
                // CPU: 1.3.6.1.4.1.3902.1015.1.1.4.2.0 or 1082...
                $cpuObj = $snmp->get('1.3.6.1.4.1.3902.1015.1.1.4.2.0');
                if ($cpuObj && count($cpuObj) > 0 && $cpuObj->first()->getValue() !== null) {
                    $cpuUsage = (int) $cpuObj->first()->getValue()->getValue();
                }

                $memObj = $snmp->get('1.3.6.1.4.1.3902.1015.1.1.4.3.0');
                if ($memObj && count($memObj) > 0 && $memObj->first()->getValue() !== null) {
                    $memUsage = (int) $memObj->first()->getValue()->getValue();
                }

                $tempObj = $snmp->get('1.3.6.1.4.1.3902.1015.1.1.4.7.0');
                if ($tempObj && count($tempObj) > 0 && $tempObj->first()->getValue() !== null) {
                    $temperature = (int) $tempObj->first()->getValue()->getValue();
                }

                // Fallback to standard Host Resources if ZTE enterprise fails
                if ($cpuUsage === 0) {
                    $cpuObj = $snmp->get('1.3.6.1.2.1.25.3.3.1.2.1');
                    if ($cpuObj && count($cpuObj) > 0 && $cpuObj->first()->getValue() !== null) {
                        $cpuUsage = (int) $cpuObj->first()->getValue()->getValue();
                    }
                }
            } catch (\Throwable $e) {
                // Ignore if not supported
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'uptime' => $uptimeFormat,
                    'cpu' => $cpuUsage,
                    'memory' => $memUsage,
                    'temperature' => $temperature,
                    'isOnline' => true
                ]
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Timeout atau gagal terkoneksi via SNMP.',
                'data' => [
                    'uptime' => '0d',
                    'cpu' => 0,
                    'memory' => 0,
                    'temperature' => 0,
                    'isOnline' => false
                ]
            ]);
        }
    }

    public function monitoring($id)
    {
        $olt = OltDevice::findOrFail($id);
        return inertia('olt-monitoring', [
            'olt' => $olt
        ]);
    }

    public function pingWatch(Request $request)
    {
        $oltId = $request->input('olt_id');
        $portIndex = $request->input('port_index');
        $uncfg = $request->input('uncfg', false);

        if ($oltId) {
            if ($portIndex) {
                $ports = \Illuminate\Support\Facades\Cache::get("olt_{$oltId}_active_ports", []);
                if (!is_array($ports)) {
                    $ports = [];
                }
                $ports[$portIndex] = time();
                // Clean up old ones (> 15 seconds)
                $ports = array_filter($ports, function($t) { return is_numeric($t) && time() - $t < 15; });
                \Illuminate\Support\Facades\Cache::put("olt_{$oltId}_active_ports", $ports, now()->addMinutes(1));
            }
            if ($uncfg) {
                \Illuminate\Support\Facades\Cache::put("olt_watch_{$oltId}_uncfg", true, now()->addSeconds(15));
            }
        }
        return response()->json(['status' => 'ok']);
    }

    public function getPorts($id)
    {
        $olt = OltDevice::findOrFail($id);

        try {
            $ip = escapeshellarg($olt->ip);
            $comm = escapeshellarg($olt->snmp_community ?: 'public');
            $ports = [];

            // ifName
            exec("snmpwalk -v2c -c $comm -On $ip 1.3.6.1.2.1.31.1.1.1.1 2>/dev/null", $outName);
            foreach ($outName as $line) {
                if (preg_match('/\.(\d+) = STRING: "(.*)"/', $line, $matches)) {
                    $name = $matches[2];
                    if (stripos($name, 'pon') !== false || stripos($name, 'ge') !== false) {
                        $ports[$matches[1]] = [
                            'index' => $matches[1],
                            'name' => $name,
                            'admin_status' => 0,
                            'oper_status' => 0,
                        ];
                    }
                }
            }

            // ifAdminStatus
            exec("snmpwalk -v2c -c $comm -On $ip 1.3.6.1.2.1.2.2.1.7 2>/dev/null", $outAdmin);
            foreach ($outAdmin as $line) {
                if (preg_match('/\.(\d+) = INTEGER: (\d+)/', $line, $matches)) {
                    if (isset($ports[$matches[1]])) {
                        $ports[$matches[1]]['admin_status'] = (int)$matches[2];
                    }
                }
            }

            // ifOperStatus
            exec("snmpwalk -v2c -c $comm -On $ip 1.3.6.1.2.1.2.2.1.8 2>/dev/null", $outOper);
            foreach ($outOper as $line) {
                if (preg_match('/\.(\d+) = INTEGER: (\d+)/', $line, $matches)) {
                    if (isset($ports[$matches[1]])) {
                        $ports[$matches[1]]['oper_status'] = (int)$matches[2];
                    }
                }
            }

            // ifAlias (Description)
            exec("snmpwalk -v2c -c $comm -On $ip 1.3.6.1.2.1.31.1.1.1.18 2>/dev/null", $outAlias);
            foreach ($outAlias as $line) {
                if (preg_match('/\.(\d+) = STRING: (.*)/', $line, $matches)) {
                    if (isset($ports[$matches[1]])) {
                        $desc = trim(str_replace('"', '', $matches[2]));
                        $ports[$matches[1]]['description'] = $desc;
                    }
                }
            }

            // sort by index
            ksort($ports);

            return response()->json([
                'status' => 'success',
                'data' => array_values($ports)
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data port via SNMP: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getOnus($id, $portIndex, $forceRefresh = false)
    {
        $olt = OltDevice::findOrFail($id);
        $cacheKey = "olt_onus_{$id}_{$portIndex}";
        if (! $forceRefresh) {
            $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);
            if ($cached) {
                return response()->json(['status' => 'success', 'data' => $cached]);
            }
        }

        try {
            $ip = escapeshellarg($olt->ip);
            $comm = escapeshellarg($olt->snmp_community ?: 'public');
            
            // If the given portIndex is an interface index (ifIndex) like 285278977,
            // we must convert it to ZTE's proprietary PON index (like 268632576).
            // We do this by fetching the interface name (e.g. gpon_1/3/1) and parsing it.
            $ifIndex = $portIndex;
            $type = 'gpon'; // default
            $portNameStr = '';
            $originalPortIndex = $portIndex;
            
            if ($portIndex > 280000000) {
                exec("snmpget -v2c -c $comm -On $ip 1.3.6.1.2.1.31.1.1.1.1.$portIndex 2>/dev/null", $outName);
                if (isset($outName[0]) && preg_match('/STRING: "?((?:gpon|epon)_(\d+)\/(\d+)\/(\d+))"?/', $outName[0], $m)) {
                    $portNameStr = $m[1];
                    // Note: ZTE uses 16 << 24 for GPON PON Index, but EPON uses original ifIndex.
                    $slot = (int)$m[3];
                    $port = (int)$m[4];
                    if (strpos($outName[0], 'epon_') !== false) {
                        $type = 'epon';
                        $portIndex = $originalPortIndex;
                    } else {
                        $portIndex = (16 << 24) | ($slot << 16) | ($port << 8);
                    }
                }
            }
            
            $portIdx = $portIndex;
            $ifIdxArg = (int)$ifIndex;

            $onus = [];
            $sns = [];
            $eponStatuses = [];
            $eponRxPowers = [];
            $eponTelnetRx = [];
            
            $gponPhaseStates = [];
            $gponSnmpNames = [];
            $gponSnmpDescs = [];

            $cachedNames = collect();
            if ($type === 'epon') {
                // Fetch cached names from database for EPON only
                $cachedNames = \Illuminate\Support\Facades\DB::table('olt_onus')
                    ->where('olt_id', $id)
                    ->where('port', $portNameStr)
                    ->get()
                    ->keyBy('onu_id');
            }

            if ($type === 'gpon') {
                // Fetch real-time GPON SNs, Names, and Descriptions for THIS PORT ONLY using lightning-fast multi-get
                $snOids = [];
                $nameOids = [];
                $descOids = [];
                for ($i = 1; $i <= 128; $i++) {
                    $snOids[] = "1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.18.{$ifIdxArg}.{$i}";
                    $nameOids[] = "1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.2.{$ifIdxArg}.{$i}";
                    $descOids[] = "1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.3.{$ifIdxArg}.{$i}";
                }
                
                $outSn = [];
                foreach (array_chunk($snOids, 64) as $chunk) {
                    exec("snmpget -v2c -c $comm -On $ip " . implode(" ", $chunk) . " 2>/dev/null", $outSnChunk);
                    $outSn = array_merge($outSn, $outSnChunk);
                }
                foreach ($outSn as $line) {
                    if (preg_match('/\.(\d+) = STRING: "\d+,(.*?)"/', $line, $matches)) {
                        $sns[$matches[1]] = trim($matches[2]);
                    } elseif (preg_match('/\.(\d+) = STRING: "(.*?)"/', $line, $matches)) {
                        $sns[$matches[1]] = trim($matches[2]);
                    }
                }
                
                // Fetch Names via SNMP
                $outName = [];
                foreach (array_chunk($nameOids, 64) as $chunk) {
                    exec("snmpget -v2c -c $comm -On -Oq $ip " . implode(" ", $chunk) . " 2>/dev/null", $outNameChunk);
                    $outName = array_merge($outName, $outNameChunk);
                }
                foreach ($outName as $line) {
                    if (preg_match('/\.(\d+) (.*)/', $line, $matches)) {
                        $nameStr = trim(str_replace('"', '', $matches[2]));
                        if (strpos($nameStr, 'No Such') === false && strpos($nameStr, 'Such Object') === false) {
                            $gponSnmpNames[$matches[1]] = $nameStr;
                        }
                    }
                }
                
                // Fetch Descriptions via SNMP
                $outDesc = [];
                foreach (array_chunk($descOids, 64) as $chunk) {
                    exec("snmpget -v2c -c $comm -On -Oq $ip " . implode(" ", $chunk) . " 2>/dev/null", $outDescChunk);
                    $outDesc = array_merge($outDesc, $outDescChunk);
                }
                foreach ($outDesc as $line) {
                    if (preg_match('/\.(\d+) (.*)/', $line, $matches)) {
                        $descStr = trim(str_replace('"', '', $matches[2]));
                        if (strpos($descStr, 'No Such') === false && strpos($descStr, 'Such Object') === false) {
                            $gponSnmpDescs[$matches[1]] = $descStr;
                        }
                    }
                }

                // Fetch phase states via Telnet for accurate Syncing/Configuring status
                try {
                    $oltPortStr = str_replace('gpon_', 'gpon-olt_', $portNameStr);
                    $outPhase = $this->executeTelnetCommand($olt, ["show gpon onu state {$oltPortStr}"]);
                    $phaseOutput = implode("\n", $outPhase);
                    $regex = '/' . preg_quote($portNameStr, '/') . ':(\d+)\s+\w+\s+\w+\s+(\w+)/m';
                    if (preg_match_all($regex, $phaseOutput, $phaseMatches)) {
                        foreach ($phaseMatches[1] as $idx => $onuId) {
                            $gponPhaseStates[$onuId] = strtolower($phaseMatches[2][$idx]);
                        }
                    }
                } catch (\Exception $e) {}
            } elseif ($type === 'epon' && $portNameStr) {
                // Fetch MAC Address and Status via decoded ZTE EPON indexing
                if (preg_match('/_(\d+)\/(\d+)\/(\d+)/', $portNameStr, $m)) {
                    $slot = (int)$m[2];
                    $port = (int)$m[3];
                    
                    // Fetch real-time EPON MACs for THIS PORT ONLY to ensure lightning-fast speed
                    $baseIdx = 0x30000000 | ($slot << 19) | (($port - 1) << 16);
                    $oids = [];
                    for ($i = 1; $i <= 64; $i++) {
                        $oids[] = "1.3.6.1.4.1.3902.1015.1010.1.1.1.1.1.4." . ($baseIdx | ($i << 8));
                    }
                    $cmd = "snmpget -v2c -c $comm -On -Oq $ip " . implode(" ", $oids) . " 2>/dev/null";
                    exec($cmd, $outMacs);
                    
                    foreach ($outMacs as $line) {
                        if (preg_match('/\.(\d+) (.*)/', $line, $matches)) {
                            $idx = (int)$matches[1];
                            $macStr = trim(str_replace('"', '', $matches[2]));
                            
                            if (strpos($macStr, 'No Such') !== false || strpos($macStr, 'Such Object') !== false) {
                                continue;
                            }
                            
                            $decSlot = ($idx >> 19) & 0x1F;
                            $decPort = (($idx >> 16) & 0x07) + 1;
                            $decOnu = ($idx >> 8) & 0xFF;
                            
                            if ($decSlot === $slot && $decPort === $port) {
                                if (strpos($macStr, '00 00 00 00 00 00') !== false) {
                                    $eponStatuses[$decOnu] = 'Offline';
                                } else {
                                    $eponStatuses[$decOnu] = 'Online';
                                }
                                $sns[$decOnu] = $macStr;
                            }
                        }
                    }
                    
                    // Pre-populate $onus with all provisioned EPON ONUs from MAC table
                    foreach ($sns as $onuId => $macStr) {
                        $rawMac = $macStr;
                        $cleanMac = str_replace(['.', ':', '-', ' '], '', $rawMac);
                        $formattedMac = (strlen($cleanMac) == 12) ? strtoupper(implode(':', str_split($cleanMac, 2))) : $rawMac;
                        
                        $cached = $cachedNames->get($onuId);
                        $displayName = $cached && $cached->name && $cached->name !== '-' ? $cached->name : 'ONU ' . $onuId;
                        
                        $onus[$onuId] = [
                            'onu_id' => (string)$onuId,
                            'mac_address' => $formattedMac,
                            'rx_power' => 'Offline', // default, will be overridden by Rx Power loop
                            'rx_raw' => null,
                            'status' => $eponStatuses[$onuId] ?? 'Offline',
                            'name' => $displayName,
                            'description' => $cached && $cached->description && $cached->description !== '-' ? $cached->description : null,
                            'vendor' => 'ZTE'
                        ];
                    }
                }
            }
            
            // Fetch Rx Power
            $rxPowerMap = [];
            
            // First, ALWAYS try SNMP for both GPON and EPON for THIS PORT ONLY using multi-get
            $maxOnus = $type === 'epon' ? 64 : 128;
            $rxOids = [];
            for ($i = 1; $i <= $maxOnus; $i++) {
                $rxOids[] = "1.3.6.1.4.1.3902.1015.1010.11.2.1.2.{$portIdx}.{$i}";
            }
            $outRx = [];
            foreach (array_chunk($rxOids, 64) as $chunk) {
                exec("snmpget -v2c -c $comm -On $ip " . implode(" ", $chunk) . " 2>/dev/null", $outRxChunk);
                $outRx = array_merge($outRx, $outRxChunk);
            }
            
            $snmpValid = false;
            
            foreach ($outRx as $line) {
                if (preg_match('/\.(\d+) = INTEGER: (-?\d+)/', $line, $matches)) {
                    $onuId = $matches[1];
                    $val = (int)$matches[2];
                    $rxPowerMap[$onuId] = $val;
                    
                    // If any ONU has a valid reading (not -80000, not 65535000), we consider SNMP successful for this port
                    if ($val < 0 && $val > -50000 && $val !== -80000) {
                        $snmpValid = true;
                    }
                }
            }
            
            if ($type === 'epon' && !$snmpValid) {
                \Illuminate\Support\Facades\Log::info("SNMP failed, running Telnet for Port {$portNameStr}");
                $rxPowerMap = []; // Clear broken SNMP data
                try {
                    $oltPortStr = str_replace('epon_', 'epon-olt_', $portNameStr);
                    $telnetRx = $this->executeTelnetCommand($olt, ["show pon power onu-rx {$oltPortStr}"]);
                    $outRxStr = implode("\n", $telnetRx);
                    if (preg_match_all('/epon-onu_[^\s]+:(\d+)\s+([-\d\.]+)\(dbm\)/', $outRxStr, $matches)) {
                        foreach ($matches[1] as $idx => $onuId) {
                            // Convert telnet float (-12.01) to SNMP int format (-12010)
                            $rxPowerMap[$onuId] = (int)round((float)$matches[2][$idx] * 1000);
                        }
                    }
                } catch (\Exception $e) {}
            }
            
            // Re-iterate over all provisioned ONUs to construct the final array
            foreach ($sns as $onuId => $rawMac) {
                $rxRawDbm = null;
                $rxVal = $rxPowerMap[$onuId] ?? null;
                
                if ($type === 'epon') {
                    $status = $eponStatuses[$onuId] ?? 'Offline';
                    if ($rxVal !== null && ($rxVal <= -50000 || $rxVal == 65535000)) {
                        $status = 'Offline';
                    }

                    if ($status === 'Offline') {
                        $rxDbm = 'Offline';
                        $status = 'Offline';
                    } else {
                        $rxRawDbm = round($rxVal / 1000, 2);
                        $rxDbm = $rxRawDbm . ' dBm';
                    }
                } else {
                    $phase = $gponPhaseStates[$onuId] ?? null;
                    $rxRaw = $rxVal !== null ? (int)$rxVal : null;
                    
                    if ($rxRaw === null || $rxRaw >= 65535000 || $rxRaw == 0 || $rxRaw == 65535 || $rxRaw <= -50000) {
                        $rxRawDbm = null;
                        $rxDbm = 'N/A';
                    } else {
                        $rxRawDbm = round($rxRaw / 1000, 2);
                        $rxDbm = $rxRawDbm . ' dBm';
                    }

                    if ($phase === 'syncing' || $phase === 'logging' || $phase === 'syncmib') {
                        $status = 'Synchronize';
                    } elseif ($phase === 'los') {
                        $status = 'LOS';
                    } elseif ($phase === 'working') {
                        $status = 'Online';
                    } elseif ($phase === 'offline') {
                        $status = 'Offline';
                    } elseif ($phase !== null) {
                        $status = 'Configuring';
                    } else {
                        $status = ($rxRaw === null || $rxRaw >= 65535000 || $rxRaw == 0 || $rxRaw == 65535 || $rxRaw <= -50000) ? 'Offline' : 'Online';
                    }
                }
                
                if ($type === 'epon') {
                    $cleanMac = str_replace(['.', ':', '-', ' '], '', $rawMac);
                    $formattedMac = (strlen($cleanMac) == 12) ? strtoupper(implode(':', str_split($cleanMac, 2))) : $rawMac;
                } else {
                    $formattedMac = $rawMac;
                }
                
                if ($type === 'gpon') {
                    $displayName = !empty($gponSnmpNames[$onuId]) ? $gponSnmpNames[$onuId] : 'ONU ' . $onuId;
                    $description = !empty($gponSnmpDescs[$onuId]) ? $gponSnmpDescs[$onuId] : null;
                } else {
                    $cached = $cachedNames->get($onuId);
                    $displayName = $cached && $cached->name && $cached->name !== '-' ? $cached->name : 'ONU ' . $onuId;
                    $description = $cached && $cached->description && $cached->description !== '-' ? $cached->description : null;
                }

                $onus[$onuId] = [
                    'onu_id' => (string)$onuId,
                    'mac_address' => $formattedMac,
                    'rx_power' => $rxDbm,
                    'rx_raw' => $rxRawDbm,
                    'status' => $status,
                    'name' => $displayName,
                    'description' => $description,
                    'vendor' => 'ZTE'
                ];
            }

            if ($type === 'epon') {
                foreach ($onus as $onuId => &$onuData) {
                    if ($onuData['status'] === 'Online' && $onuData['rx_power'] === 'Offline') {
                        $onuData['rx_power'] = 'N/A';
                    }
                }
                unset($onuData); // break reference
            }

            // sort by onu_id
            ksort($onus);
            $onusArray = array_values($onus);

            \Illuminate\Support\Facades\Cache::put($cacheKey, $onusArray, now()->addSeconds(30));

            \Illuminate\Support\Facades\Log::info("API return for port {$originalPortIndex}: " . count($onusArray) . " ONUs");

            return response()->json([
                'status' => 'success',
                'data' => $onusArray
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("getOnus Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }



 public function monitoringIndex(Request $request)
    {
        $olts = OltDevice::all();
        if ($olts->isEmpty()) {
            return redirect()->route('olt')->with('error', 'Tidak ada perangkat OLT.');
        }

        $oltId = $request->query('olt_id', $olts->first()->id);
        $selectedOlt = $olts->where('id', $oltId)->first() ?? $olts->first();

        return inertia('olt-monitoring', [
            'olts' => $olts,
            'selectedOltId' => $selectedOlt->id,
            'olt' => $selectedOlt
        ]);
    }

    private function executeTelnetCommand($olt, $commands)
    {
        $fp = @fsockopen($olt->ip, $olt->port == 161 ? 23 : ($olt->port ?: 23), $errno, $errstr, 4);
        if (!$fp) return null;
        
        stream_set_timeout($fp, 2);
        
        $readUntil = function($fp, $prompt, $timeout = 2) {
            $out = ""; $start = microtime(true);
            while (!feof($fp)) {
                $out .= fread($fp, 2048);
                if (strpos($out, $prompt) !== false) break;
                if (microtime(true) - $start >= $timeout) break;
            }
            return $out;
        };
        
        $readUntil($fp, "Username:", 4);
        fwrite($fp, $olt->username . "\n");
        $readUntil($fp, "Password:", 4);
        fwrite($fp, $olt->password . "\n");
        $readUntil($fp, "#", 4);
        
        fwrite($fp, "terminal length 0\n");
        $readUntil($fp, "#", 4);

        $results = [];
        foreach ($commands as $cmd) {
            fwrite($fp, $cmd . "\n");
            $results[] = $readUntil($fp, "#", 10);
        }
        
        fclose($fp);
        return $results;
    }

    public function getGponUncfg($id)
    {
        $olt = OltDevice::findOrFail($id);
        $results = $this->executeTelnetCommand($olt, ["show gpon onu uncfg"]);
        
        if (!$results) {
            return response()->json(['status' => 'error', 'message' => 'Gagal terkoneksi ke OLT via Telnet'], 500);
        }
        
        $res = $results[0];
        $uncfgOnus = [];
        
        // Parse "OnuIndex   Sn           State" or similar format
        if (strpos($res, 'No related information to show') !== false) {
            return response()->json(['status' => 'success', 'data' => []]);
        }
        
        // GPON ZTE typical uncfg output:
        // OnuIndex                 Sn                  State
        // ---------------------------------------------------------------------
        // gpon-onu_1/3/2:1         ZTEGC1234567        unknown
        $lines = explode("\n", $res);
        foreach ($lines as $line) {
            $line = trim($line);
            if (preg_match('/^gpon-onu_([0-9\/]+):(\d+)\s+([A-Za-z0-9]+)\s+/', $line, $m) || 
                preg_match('/^gpon-onu_([0-9\/]+)\s+([A-Za-z0-9]+)\s+/', $line, $m)) {
                // Sometime index is just port, sometimes with onu ID
                if (count($m) == 4) {
                    $port = $m[1];
                    $sn = $m[3];
                } else {
                    $port = $m[1];
                    $sn = $m[2];
                }
                $uncfgOnus[] = [
                    'port' => $port,
                    'sn' => $sn
                ];
            }
        }
        
        return response()->json(['status' => 'success', 'data' => $uncfgOnus]);
    }

    public function getGponProfiles($id)
    {
        $olt = OltDevice::findOrFail($id);
        $results = $this->executeTelnetCommand($olt, ["show gpon profile tcont"]);
        
        if (!$results) {
            return response()->json(['status' => 'error', 'message' => 'Gagal terkoneksi ke OLT via Telnet'], 500);
        }
        
        $res = $results[0];
        $profiles = [];
        
        // Parse "Profile name :1G"
        $lines = explode("\n", $res);
        foreach ($lines as $line) {
            if (preg_match('/Profile name\s*:(.*)/i', $line, $m)) {
                $profile = trim($m[1]);
                if (!in_array($profile, $profiles)) {
                    $profiles[] = $profile;
                }
            }
        }
        
        return response()->json(['status' => 'success', 'data' => $profiles]);
    }

    public function getGponVlans($id)
    {
        $olt = OltDevice::findOrFail($id);
        $results = $this->executeTelnetCommand($olt, ["show vlan summary"]);
        
        if (!$results) {
            return response()->json(['status' => 'error', 'message' => 'Gagal terkoneksi ke OLT via Telnet'], 500);
        }
        
        $output = $results[0];
        $vlans = [];
        
        if (preg_match('/Details are following:\s*([\d\s,-]+)/', $output, $match)) {
            $vlanStr = trim($match[1]);
            $parts = explode(',', $vlanStr);
            foreach ($parts as $part) {
                $part = trim($part);
                if (strpos($part, '-') !== false) {
                    list($start, $end) = explode('-', $part);
                    $start = (int)$start;
                    $end = (int)$end;
                    if ($end - $start < 1000) { // Limit expansion
                        for ($i = $start; $i <= $end; $i++) {
                            $vlans[] = (string)$i;
                        }
                    }
                } elseif (is_numeric($part)) {
                    $vlans[] = (string)$part;
                }
            }
        }
        
        // Remove duplicates and sort
        $vlans = array_unique($vlans);
        sort($vlans, SORT_NUMERIC);
        
        return response()->json(['status' => 'success', 'data' => $vlans]);
    }

    public function getGponOnuTypes($id)
    {
        $olt = OltDevice::findOrFail($id);
        $results = $this->executeTelnetCommand($olt, ["show running-config | include onu-type"]);
        
        if (!$results) {
            return response()->json(['status' => 'error', 'message' => 'Gagal terkoneksi ke OLT via Telnet'], 500);
        }
        
        $res = $results[0];
        $types = [];
        
        $lines = explode("\n", $res);
        foreach ($lines as $line) {
            if (preg_match('/^\s*onu-type\s+([A-Za-z0-9\-\_]+)\s+gpon/i', $line, $m)) {
                $type = trim($m[1]);
                if (!in_array($type, $types)) {
                    $types[] = $type;
                }
            }
        }
        
        // Add a few common defaults just in case parsing fails or nothing is returned
        if (empty($types)) {
            $types = ['ZTE-G', 'HUAWEI', 'FIBERHOME', 'VSOL'];
        }
        
        sort($types);
        
        return response()->json(['status' => 'success', 'data' => array_values($types)]);
    }

    public function provisionGponOnu(Request $request, $id)
    {
        $validated = $request->validate([
            'port' => 'required|string',
            'sn' => 'required|string',
            'name' => 'required|string',
            'onu_type' => 'required|string'
        ]);

        $olt = OltDevice::findOrFail($id);
        $port = $validated['port'];
        $sn = $validated['sn'];
        $name = $validated['name'];
        $onuType = $validated['onu_type'];

        // Determine next free ONU ID for the port
        $results = $this->executeTelnetCommand($olt, ["show gpon onu state gpon-olt_{$port}"]);
        if (!$results) {
            return response()->json(['status' => 'error', 'message' => 'Gagal terkoneksi ke OLT'], 500);
        }

        $res = $results[0];
        $usedIds = [];
        if (preg_match_all('/gpon-onu_[0-9\/]+:(\d+)/i', $res, $matches)) {
            foreach ($matches[1] as $matchId) {
                $usedIds[] = (int)$matchId;
            }
        }
        
        $newOnuId = 1;
        while (in_array($newOnuId, $usedIds) && $newOnuId <= 128) {
            $newOnuId++;
        }

        if ($newOnuId > 128) {
            return response()->json(['status' => 'error', 'message' => 'Port GPON penuh (maksimal 128 ONU)'], 400);
        }

        $commands = [
            "conf t",
            "interface gpon-olt_{$port}",
            "onu {$newOnuId} type {$onuType} sn {$sn}",
            "exit",
            "interface gpon-onu_{$port}:{$newOnuId}",
            "name {$name}",
            "exit",
            "exit"
        ];

        $execRes = $this->executeTelnetCommand($olt, $commands);
        
        // Log it to a file for debugging
        file_put_contents(storage_path("logs/gpon_provision_{$sn}.log"), implode("\n", $commands) . "\n\nRESULT:\n" . json_encode($execRes));

        return response()->json([
            'status' => 'success', 
            'message' => "ONU berhasil didaftarkan pada port {$port}:{$newOnuId}",
            'onu_id' => $newOnuId
        ]);
    }

    public function configureGponService(Request $request, $id)
    {
        $validated = $request->validate([
            'port' => 'required|string',
            'onu_id' => 'required|numeric',
            'tcont_id' => 'required|numeric',
            'gemport_id' => 'required|numeric',
            'tcont_profile' => 'required|string',
            'vlan' => 'required|numeric',
            'mode' => 'required|in:bridge,pppoe,dhcp,static',
            'pppoe_user' => 'nullable|string',
            'pppoe_pass' => 'nullable|string',
            'static_ip' => 'nullable|string',
            'static_mask' => 'nullable|string',
            'static_gw' => 'nullable|string',
            'tcont_name' => 'required|string',
            'gemport_name' => 'required|string',
            'encryption_mode' => 'required|in:disable,aes'
        ]);

        $olt = OltDevice::findOrFail($id);
        $port = $validated['port'];
        $onuId = $validated['onu_id'];
        $tcontId = $validated['tcont_id'];
        $gemportId = $validated['gemport_id'];
        $tcont = $validated['tcont_profile'];
        $vlan = $validated['vlan'];
        $mode = $validated['mode'];
        $tcontName = $validated['tcont_name'];
        $gemName = $validated['gemport_name'];
        $encMode = $validated['encryption_mode'];

        $commands = [
            "conf t",
            "gpon",
            "onu profile vlan vlan{$vlan} tag-mode tag cvlan {$vlan}",
            "exit",
            "interface gpon-onu_{$port}:{$onuId}",
            "tcont {$tcontId} name {$tcontName} profile {$tcont}",
            "gemport {$gemportId} name {$gemName} tcont {$tcontId}",
            $encMode !== 'disable' ? "gemport {$gemportId} encryption {$encMode}" : "",
            "service-port 1 vport {$gemportId} user-vlan {$vlan} vlan {$vlan}",
            "exit"
        ];
        
        $commands = array_filter($commands);

        $commands[] = "pon-onu-mng gpon-onu_{$port}:{$onuId}";
        $commands[] = "service 1 gemport {$gemportId} vlan {$vlan}";

        if ($mode !== 'bridge') {
            if ($mode === 'pppoe') {
                $user = $validated['pppoe_user'] ?? '';
                $pass = $validated['pppoe_pass'] ?? '';
                $commands[] = "wan-ip 1 mode pppoe username {$user} password {$pass} vlan-profile vlan{$vlan} host 1";
            } elseif ($mode === 'dhcp') {
                $commands[] = "wan-ip 1 mode dhcp vlan-profile vlan{$vlan} host 1";
            } elseif ($mode === 'static') {
                $ip = $validated['static_ip'] ?? '';
                $mask = $validated['static_mask'] ?? '';
                $gw = $validated['static_gw'] ?? '';
                $commands[] = "wan-ip 1 mode static ip {$ip} mask {$mask} gateway {$gw} vlan-profile vlan{$vlan} host 1";
            }
        } else {
            $commands[] = "vlan port eth_0/1 mode tag vlan {$vlan}";
            $commands[] = "vlan port eth_0/2 mode tag vlan {$vlan}";
            $commands[] = "vlan port eth_0/3 mode tag vlan {$vlan}";
            $commands[] = "vlan port eth_0/4 mode tag vlan {$vlan}";
        }
        $commands[] = "exit";
        $commands[] = "exit";

        $execRes = $this->executeTelnetCommand($olt, $commands);
        
        $safePort = str_replace('/', '_', $port);
        file_put_contents(storage_path("logs/gpon_service_{$safePort}_{$onuId}.log"), implode("\n", $commands) . "\n\nRESULT:\n" . json_encode($execRes));

        return response()->json([
            'status' => 'success', 
            'message' => "Service berhasil dikonfigurasi pada ONU {$port}:{$onuId}"
        ]);
    }

    public function deleteOnu(Request $request, $id)
    {
        $validated = $request->validate([
            'port' => 'required|string',
            'onu_id' => 'required|string'
        ]);
        
        $olt = OltDevice::findOrFail($id);
        $port = $validated['port']; // e.g., "gpon_1/3/1"
        $onuId = $validated['onu_id'];

        // Format port string to interface name, e.g., "gpon_1/3/1" -> "gpon-olt_1/3/1"
        // Or "epon_1/1/1" -> "epon-olt_1/1/1"
        $iface = str_replace('_', '-olt_', $port);
        
        $commands = [
            "conf t",
            "interface {$iface}",
            "no onu {$onuId}",
            "exit",
            "exit"
        ];

        $execRes = $this->executeTelnetCommand($olt, $commands);

        return response()->json([
            'status' => 'success', 
            'message' => "ONU {$onuId} pada port {$port} berhasil dihapus/di-uncfg."
        ]);
    }

    public function onuDetailPage($id, $port, $onuId)
    {
        $port = str_replace('-', '/', $port);
        $olt = OltDevice::findOrFail($id);
        return inertia('olt/onu-detail', [
            'olt' => $olt,
            'port' => $port, // e.g. gpon_1/3/1
            'onuId' => $onuId
        ]);
    }

    public function getOnuDetail(Request $request, $id, $port, $onuId)
    {
        $port = str_replace('-', '/', $port);
        $olt = OltDevice::findOrFail($id);
        $type = strpos($port, 'epon') !== false ? 'epon' : 'gpon';
        
        // Convert port to interface name
        $ifaceBase = str_replace('_', '-olt_', $port); // gpon-olt_1/3/1
        $onuIface = str_replace('_', '-onu_', $port) . ':' . $onuId; // gpon-onu_1/3/1:1

        $commands = [];
        if ($type === 'gpon') {
            $commands[] = "show gpon onu detail-info {$onuIface}";
            $commands[] = "show gpon onu alarm {$onuIface}";
            $commands[] = "show pon power attenuation {$onuIface}";
            $commands[] = "show pon power onu-rx {$onuIface}";
            $commands[] = "show gpon onu tcont {$onuIface}";
            $commands[] = "show gpon onu gemport {$onuIface}";
            $commands[] = "show pon onu information {$onuIface}";
        } else {
            $commands[] = "show onu detail-info {$onuIface}";
            $commands[] = "show onu alarm {$onuIface}";
            $commands[] = "show pon power attenuation {$onuIface}";
            $commands[] = "show pon power onu-rx {$onuIface}";
            $commands[] = "show pon onu information {$onuIface}";
        }

        $res = $this->executeTelnetCommand($olt, $commands);
        $detailOutput = $res[0] ?? '';
        $alarmOutput = $res[1] ?? '';
        $attenuationOutput = $res[2] ?? '';
        $rxPowerOutput = $res[3] ?? '';

        $status = 'Offline';
        if (preg_match('/Phase state:\s*working/i', $detailOutput) || preg_match('/Physical State:\s*online/i', $detailOutput) || preg_match('/Status:\s*Online/i', $detailOutput)) {
            $status = 'Online';
        }

        // Parse detail output
        $details = [
            'olt_name' => $olt->name,
            'port' => $port,
            'onu_id' => $onuId,
            'type' => $type,
            'status' => $status,
            'mac_sn' => '',
            'onu_type' => '',
            'name' => '',
            'description' => '',
            'rx_power' => '',
            'online_duration' => '',
        ];

        if (preg_match('/(?:Serial number|SN):\h*(.+)/i', $detailOutput, $m)) {
            $details['mac_sn'] = trim($m[1]);
        }
        
        // Also look for MAC specifically, being careful not to capture label
        if (preg_match('/(?:Mac address|MAC):\h*([a-fA-F0-9\.\:]+)/i', $detailOutput, $m)) {
            $rawMac = str_replace(['.', ':', '-'], '', trim($m[1]));
            if (strlen($rawMac) == 12) {
                $formatted = strtoupper(implode(':', str_split($rawMac, 2)));
                // Only overwrite if mac_sn is empty or not 12 chars
                if (!trim($details['mac_sn']) || strlen(str_replace(['.',':'], '', $details['mac_sn'])) !== 12) {
                    $details['mac_sn'] = $formatted;
                }
            } else if (!trim($details['mac_sn'])) {
                $details['mac_sn'] = strtoupper(trim($m[1]));
            }
        }

        // Simple OUI / SN prefix vendor lookup for EPON/GPON fallback
        $details['vendor'] = 'Unknown';
        if ($details['mac_sn']) {
            if ($type === 'gpon') {
                $snPrefix = strtoupper(substr($details['mac_sn'], 0, 4));
                $gponVendorMap = [
                    'ZTEG' => 'ZTE',
                    'HWTC' => 'Huawei',
                    'FHTT' => 'Fiberhome',
                    'ALCL' => 'Nokia/Alcatel',
                    'UMTC' => 'VSOL/HSGQ', // UMTC often used by OEM ONUs
                    'VSOL' => 'V-SOL',
                    'HSGQ' => 'HSGQ',
                    'CIGG' => 'CIG'
                ];
                if (isset($gponVendorMap[$snPrefix])) {
                    $details['vendor'] = $gponVendorMap[$snPrefix];
                }
            }
            
            if ($details['vendor'] === 'Unknown' || $type === 'epon') {
                $macPrefix = strtoupper(substr(str_replace([':', '.'], '', $details['mac_sn']), 0, 6));
                $ouiMap = [
                    '6CD2B2' => 'ZTE', 'E067B3' => 'ZTE', 'F43E61' => 'ZTE', '8C68C8' => 'ZTE', 
                    '4413D0' => 'ZTE', '34E380' => 'ZTE', '5C3A3D' => 'ZTE', 'D49E08' => 'ZTE',
                    '5078B3' => 'ZTE',
                    '0015A4' => 'Huawei', '4C11AE' => 'Huawei', '00259E' => 'Huawei', '0819A6' => 'Huawei',
                    'E468A3' => 'Fiberhome', '0019C3' => 'Fiberhome', 'F4CFA2' => 'Fiberhome',
                    'E0E8E6' => 'HSGQ', '002226' => 'V-SOL',
                ];
                if (isset($ouiMap[$macPrefix])) {
                    $details['vendor'] = $ouiMap[$macPrefix];
                }
            }
        }
        
        if (preg_match('/Vendor (?:name|ID):\h*(.+)/i', $detailOutput, $m)) {
            $vendor = trim($m[1]);
            if ($vendor && $vendor !== 'Unknown') $details['vendor'] = $vendor;
        }

        if (preg_match('/Onu\s*type:\h*(.+)/i', $detailOutput, $m)) $details['onu_type'] = trim($m[1]);
        
        $ponInfoOutput = $type === 'epon' ? ($res[4] ?? '') : ($res[6] ?? '');
        if (preg_match('/ONU type reported:\h*(.+)/i', $ponInfoOutput, $m)) {
            $details['onu_type'] = trim($m[1]);
        }
        
        if (preg_match('/(?:ONU )?Name:\h*(.+)/i', $detailOutput, $m)) $details['name'] = trim($m[1]);
        if (preg_match('/(?:ONU )?(?:Description|GeneralDescription):\h*(.+)/i', $detailOutput, $m)) {
            $desc = trim($m[1]);
            if (strpos($desc, '$$') !== false) {
                $parts = explode('$$', $desc);
                $details['description'] = end($parts);
            } else {
                $details['description'] = $desc;
            }
        }
        
        if ($status !== 'Online') {
            $details['online_duration'] = '-';
        } else {
            if (preg_match('/Online Duration:\h*(.+)/i', $detailOutput, $m)) {
                $details['online_duration'] = trim($m[1]);
            } elseif (preg_match('/^\s*1\s+(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2})/m', $detailOutput, $m)) {
                try {
                    $registerTime = \Carbon\Carbon::createFromFormat('Y/m/d H:i:s', $m[1]);
                    $diff = $registerTime->diff(now());
                    $durations = [];
                    if ($diff->y > 0) $durations[] = $diff->y . " tahun";
                    if ($diff->m > 0) $durations[] = $diff->m . " bulan";
                    if ($diff->d > 0) $durations[] = $diff->d . " hari";
                    if ($diff->h > 0) $durations[] = $diff->h . " jam";
                    if ($diff->i > 0) $durations[] = $diff->i . " menit";
                    if (empty($durations)) $durations[] = $diff->s . " detik";
                    $details['online_duration'] = implode(' ', $durations);
                } catch (\Exception $e) {
                    $details['online_duration'] = 'Sejak ' . $m[1];
                }
            }
        }

        // Parse Alarms (Log) from combined outputs (EPON history is often in detailOutput, GPON in ponInfoOutput)
        $logs = [];
        $combinedOutput = $detailOutput . "\n" . $ponInfoOutput;
        if (preg_match_all('/(\d{4}[-\/]\d{2}[-\/]\d{2}\s\d{2}:\d{2}:\d{2})\s+(\d{4}[-\/]\d{2}[-\/]\d{2}\s\d{2}:\d{2}:\d{2}|0000[-\/]00[-\/]00\s00:00:00)(?:\s+(\d{4}[-\/]\d{2}[-\/]\d{2}\s\d{2}:\d{2}:\d{2}|0000[-\/]00[-\/]00\s00:00:00))?\s*(.*?)(?=\n\s*(?:\d+\s+\d{4}[-\/]|20\d{2}[-\/]|0000[-\/]|OLT-|ONU interface:|----)|$)/s', $combinedOutput, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) {
                if (!empty($m[3])) {
                    // EPON: Register, Authpass, Offline
                    $authTime = str_replace('/', '-', $m[2]);
                    $offTime = str_replace('/', '-', $m[3]);
                } else {
                    // GPON: Authpass, Offline
                    $authTime = str_replace('/', '-', $m[1]);
                    $offTime = str_replace('/', '-', $m[2]);
                }
                $cause = trim($m[4]);
                
                // Truncate any boilerplate output that got mistakenly captured as cause
                $cutoffs = ['OLT-', 'ONU interface:', 'MAC', '---'];
                foreach ($cutoffs as $c) {
                    if (($pos = strpos($cause, $c)) !== false) {
                        $cause = substr($cause, 0, $pos);
                    }
                }
                
                // Clean up extra date columns that EPON might include (e.g. Ack time or truncated dates)
                $cause = preg_replace('/\d{4}[-\/]\d{2}[-\/]\d{2}\s\d{2}:\d{2}(:\d{1,2})?:?/', '', $cause);
                $cause = preg_replace('/0000[-\/]00[-\/]00\s00:00:00/', '', $cause);
                
                // Clean up stray numbers/chars left from bad column splits (like "53 " or ":")
                $cause = preg_replace('/^\d{2}\s+/', '', $cause);
                $cause = preg_replace('/\s+\d{2}$/', '', $cause);
                $cause = preg_replace('/^00$/', '', $cause);
                $cause = preg_replace('/^:/', '', trim($cause));
                $cause = preg_replace('/:$/', '', trim($cause));
                
                // Normalize spaces and newlines so that wrapped words are consistent
                $cause = preg_replace('/\s+/', ' ', trim($cause));
                
                // Fix weird spacing caused by EPON terminal wrapping (now reliable after normalizing spaces)
                $cause = str_ireplace(
                    ['Lin k', 'Pow er', 'disconnec t'],
                    ['Link', 'Power', 'disconnect'],
                    $cause
                );
                
                if ($authTime !== '0000-00-00 00:00:00' && $authTime === $offTime) {
                    if (empty($cause)) {
                        $logs[] = ['time' => $authTime, 'message' => "ONU Online (Authpass)"];
                    } else {
                        $logs[] = ['time' => $offTime, 'message' => "ONU Offline - Cause: $cause"];
                    }
                } else {
                    if ($authTime !== '0000-00-00 00:00:00') {
                        $logs[] = ['time' => $authTime, 'message' => "ONU Online (Authpass)"];
                    }
                    if ($offTime !== '0000-00-00 00:00:00') {
                        $logs[] = ['time' => $offTime, 'message' => "ONU Offline" . ($cause ? " - Cause: $cause" : "")];
                    }
                }
            }
            
            // Remove duplicates (since we combined outputs, the same history might appear twice)
            $logs = array_map("unserialize", array_unique(array_map("serialize", $logs)));
            
            // Sort logs by time descending
            usort($logs, function($a, $b) {
                return strtotime($b['time']) - strtotime($a['time']);
            });
            // Re-index array
            $logs = array_values($logs);
        }

        $details['olt_rx'] = 'N/A';
        if (preg_match('/up\s+Rx\s*:\s*(-?\d+\.\d+)/i', $attenuationOutput, $m)) {
            $details['olt_rx'] = trim($m[1]) . ' dBm';
        }

        if (preg_match('/down\s+Tx.+?Rx\s*:\s*(-?\d+\.\d+)/i', $attenuationOutput, $m)) {
            $details['rx_power'] = trim($m[1]) . ' dBm';
        } elseif (preg_match('/(-?\d+\.\d+)\(dbm\)/i', $rxPowerOutput, $m)) {
            $details['rx_power'] = trim($m[1]) . ' dBm';
        } elseif (preg_match('/Rx power\(dBm\)\s*:\s*(-?\d+\.\d+)/i', $rxPowerOutput, $m)) {
            $details['rx_power'] = trim($m[1]) . ' dBm';
        }

        $details['tconts_raw'] = '';
        $details['gemports_raw'] = '';
        if ($type === 'gpon') {
            $tcontOut = $res[4] ?? '';
            $gemOut = $res[5] ?? '';
            
            // Clean up outputs a bit
            $tcontOut = preg_replace('/^.*?T-CONT\s+/is', 'T-CONT ', $tcontOut);
            $tcontOut = preg_replace('/OLT.*$/is', '', $tcontOut);
            
            $gemOut = preg_replace('/^.*?Gemport\s+/is', 'Gemport ', $gemOut);
            $gemOut = preg_replace('/OLT.*$/is', '', $gemOut);
            
            $details['tconts_raw'] = trim($tcontOut);
            $details['gemports_raw'] = trim($gemOut);
        }

        // Cache the name and description in local DB for the table view
        \Illuminate\Support\Facades\DB::table('olt_onus')->updateOrInsert(
            ['olt_id' => $id, 'port' => $port, 'onu_id' => $onuId],
            ['name' => $details['name'] ?? null, 'description' => $details['description'] ?? null]
        );

        return response()->json([
            'status' => 'success',
            'data' => $details,
            'logs' => $logs
        ]);
    }

    public function getOnuTraffic(Request $request, $id, $port, $onuId)
    {
        $port = str_replace('-', '/', $port);
        // Fetch traffic via SNMP standard IF-MIB if possible, 
        // or return simulated data if SNMP fails for specific ONU interfaces.
        $olt = OltDevice::findOrFail($id);
        $type = strpos($port, 'epon') !== false ? 'epon' : 'gpon';
        $onuIface = str_replace('_', '-onu_', $port) . ':' . $onuId;
        
        $downloadKbps = 0;
        $uploadKbps = 0;

        try {
            // Fetch real traffic directly from OLT via Telnet
            $commands = ["show interface {$onuIface}"];
            $res = $this->executeTelnetCommand($olt, $commands);
            $output = $res[0] ?? '';

            if (preg_match('/Input rate\s*:\s*([0-9.]+)\s*(Bps|Kbps|Mbps|Gbps)/i', $output, $mIn)) {
                $val = (float)$mIn[1];
                $unit = strtolower($mIn[2]);
                // Input on OLT = Upstream from ONU
                if ($unit === 'bps') $uploadKbps = ($val * 8) / 1000;
                elseif ($unit === 'kbps') $uploadKbps = $val;
                elseif ($unit === 'mbps') $uploadKbps = $val * 1000;
                elseif ($unit === 'gbps') $uploadKbps = $val * 1000000;
            }

            if (preg_match('/Output rate\s*:\s*([0-9.]+)\s*(Bps|Kbps|Mbps|Gbps)/i', $output, $mOut)) {
                $val = (float)$mOut[1];
                $unit = strtolower($mOut[2]);
                // Output on OLT = Downstream to ONU
                if ($unit === 'bps') $downloadKbps = ($val * 8) / 1000;
                elseif ($unit === 'kbps') $downloadKbps = $val;
                elseif ($unit === 'mbps') $downloadKbps = $val * 1000;
                elseif ($unit === 'gbps') $downloadKbps = $val * 1000000;
            }
        } catch (\Exception $e) {
            // Silently fail and return 0 if ONU is offline or OLT unreachable
        }

        return response()->json([
            'status' => 'success',
            'download' => round($downloadKbps, 2),
            'upload' => round($uploadKbps, 2),
            'timestamp' => now()->format('Y-m-d H:i:s')
        ]);
    }

    public function updateOnuName(Request $request, $id, $port, $onuId)
    {
        $port = str_replace('-', '/', $port);
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'description' => 'nullable|string|max:100'
        ]);

        $olt = OltDevice::findOrFail($id);
        $type = strpos($port, 'epon') !== false ? 'epon' : 'gpon';
        $oltPort = str_replace(['gpon-', 'epon-'], '', $port);
        $onuIface = str_replace('_', '-onu_', $port) . ':' . $onuId;

        $name = !empty($validated['name']) ? $validated['name'] : '-';
        $description = !empty($validated['description']) ? $validated['description'] : '-';

        if ($type === 'gpon') {
            $commands = [
                "conf t",
                "interface gpon-olt_{$oltPort}",
                "onu {$onuId} name {$name}",
                "onu {$onuId} description {$description}",
                "exit",
                "exit"
            ];
        } else {
            $commands = [
                "conf t",
                "interface {$onuIface}",
                "property name {$name}",
                "property description {$description}",
                "exit",
                "exit"
            ];
        }

        $this->executeTelnetCommand($olt, $commands);

        // Cache it in the local database so the table can display it quickly
        \Illuminate\Support\Facades\DB::table('olt_onus')->updateOrInsert(
            ['olt_id' => $id, 'port' => $port, 'onu_id' => $onuId],
            ['name' => $name, 'description' => $description]
        );

        return response()->json(['status' => 'success', 'message' => 'Nama ONU berhasil diubah!']);
    }

    public function performOnuAction(Request $request, $id, $port, $onuId)
    {
        $port = str_replace('-', '/', $port);
        $action = $request->input('action');
        $olt = OltDevice::findOrFail($id);
        $onuIface = str_replace('_', '-onu_', $port) . ':' . $onuId;

        $commands = ["conf t", "interface {$onuIface}"];
        
        if ($action === 'reboot') {
            $commands[] = "reset";
            $message = "Perintah reboot telah dikirim ke ONU.";
        } else {
            return response()->json(['status' => 'error', 'message' => 'Aksi tidak valid'], 400);
        }

        $commands[] = "exit";
        $commands[] = "exit";

        $this->executeTelnetCommand($olt, $commands);

        return response()->json(['status' => 'success', 'message' => $message]);
    }
}
