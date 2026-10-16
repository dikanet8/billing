<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\GenieacsServer;

class GenieAcsService
{
    /**
     * Get the active ACS Server config. For now we use the first one, or fallback to the provided IP.
     */
    protected function getServer()
    {
        $server = GenieacsServer::where('is_active', 1)->first();
        if (!$server) {
            // Fallback to the one user provided if none active
            return (object)[
                'ip' => '45.198.10.157',
                'port_api' => 7557
            ];
        }
        return $server;
    }

    /**
     * Fetch all CPE devices from GenieACS API.
     */
    public function getDevices()
    {
        $server = $this->getServer();
        $url = "http://{$server->ip}:{$server->port_api}/devices";

        try {
            // We use projection to limit the returned payload size. Include _deviceId and _lastInform to ensure they are available.
            $response = Http::timeout(10)->get($url, [
                'projection' => '_id,_deviceId,_lastInform,InternetGatewayDevice.DeviceInfo.Manufacturer,InternetGatewayDevice.DeviceInfo.ModelName,InternetGatewayDevice.DeviceInfo.SoftwareVersion,_lastBoot,VirtualParameters.IPTR069,VirtualParameters.PonMac,VirtualParameters.RXPower,VirtualParameters.WlanPassword,VirtualParameters.activedevices,VirtualParameters.gettemp,VirtualParameters.pppoeIP,VirtualParameters.pppoeMac,VirtualParameters.pppoePassword,VirtualParameters.pppoeUsername,VirtualParameters.SSID,VirtualParameters.ssid,InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID,InternetGatewayDevice.LANDevice.1.Hosts.Host'
            ]);

            if ($response->successful()) {
                $devices = $response->json();
                $formatted = [];
                
                foreach ($devices as $device) {
                    $manufacturer = data_get($device, '_deviceId._Manufacturer') ?? data_get($device, 'InternetGatewayDevice.DeviceInfo.Manufacturer._value', 'Unknown');
                    $modelName = data_get($device, '_deviceId._ProductClass') ?? data_get($device, 'InternetGatewayDevice.DeviceInfo.ModelName._value', 'Unknown');
                    $firmware = data_get($device, 'InternetGatewayDevice.DeviceInfo.SoftwareVersion._value', '-');
                    
                    // Virtual Parameters Extraction
                    $wanIp = data_get($device, 'VirtualParameters.pppoeIP._value', 'Menunggu...');
                    $pppoeUsername = data_get($device, 'VirtualParameters.pppoeUsername._value', '-');
                    $pppoePassword = data_get($device, 'VirtualParameters.pppoePassword._value', '-');
                    $pppoeMac = data_get($device, 'VirtualParameters.pppoeMac._value', '-');
                    $rxPower = data_get($device, 'VirtualParameters.RXPower._value', '-');
                    $temp = data_get($device, 'VirtualParameters.gettemp._value', '-');
                    $ponMac = data_get($device, 'VirtualParameters.PonMac._value', '-');
                    $wlanPassword = data_get($device, 'VirtualParameters.WlanPassword._value', '-');
                    $activeDevices = data_get($device, 'VirtualParameters.activedevices._value', '0');
                    $ipTr069 = data_get($device, 'VirtualParameters.IPTR069._value', '-');
                    
                    $ssid = data_get($device, 'VirtualParameters.SSID._value') 
                            ?? data_get($device, 'VirtualParameters.ssid._value') 
                            ?? data_get($device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID._value', '');

                    // Extract and combine Hosts
                    $hostsData = data_get($device, 'InternetGatewayDevice.LANDevice.1.Hosts.Host', []);
                    $parsedHosts = [];
                    if (is_array($hostsData)) {
                        foreach ($hostsData as $key => $hostData) {
                            if (!is_array($hostData) || !isset($hostData['MACAddress']['_value'])) continue;
                            
                            $parsedHosts[] = [
                                'hostname' => data_get($hostData, 'HostName._value', 'Unknown'),
                                'ipAddress' => data_get($hostData, 'IPAddress._value', '-'),
                                'macAddress' => data_get($hostData, 'MACAddress._value', '-'),
                                'interfaceType' => data_get($hostData, 'InterfaceType._value', 'LAN/WLAN')
                            ];
                        }
                    }
                    
                    // Calculate Status based on _lastInform (e.g., if informed within last 1 hour, consider Online)
                    $status = 'Offline';
                    if (isset($device['_lastInform'])) {
                        $lastInformTime = \Carbon\Carbon::parse($device['_lastInform']);
                        if ($lastInformTime->diffInHours(now()) < 24) {
                            $status = 'Online';
                        }
                    } else if (isset($device['_lastBoot'])) { // fallback to last boot if inform not available
                        $lastBootTime = \Carbon\Carbon::parse($device['_lastBoot']);
                        if ($lastBootTime->diffInDays(now()) < 7) {
                            $status = 'Online';
                        }
                    }

                    $formatted[] = [
                        'id' => $device['_id'] ?? 'Unknown',
                        'serialNumber' => $device['_id'] ?? 'Unknown',
                        'manufacturer' => $manufacturer,
                        'modelName' => $modelName,
                        'firmware' => $firmware,
                        'wanIp' => $wanIp,
                        'pppoeUsername' => $pppoeUsername,
                        'pppoePassword' => $pppoePassword,
                        'pppoeMac' => $pppoeMac,
                        'rxPower' => $rxPower,
                        'temperature' => $temp,
                        'ponMac' => $ponMac,
                        'wlanPassword' => $wlanPassword,
                        'activeDevices' => $activeDevices,
                        'ipTr069' => $ipTr069,
                        'ssid' => $ssid,
                        'hosts' => $parsedHosts,
                        'profile' => 'PPPoE Router',
                        'status' => $status,
                        'lastSync' => isset($device['_lastInform']) ? \Carbon\Carbon::parse($device['_lastInform'])->diffForHumans() : (isset($device['_lastBoot']) ? \Carbon\Carbon::parse($device['_lastBoot'])->diffForHumans() : 'Unknown')
                    ];
                }
                return $formatted;
            }
        } catch (\Exception $e) {
            \Log::error('GenieACS Fetch Error: ' . $e->getMessage());
        }

        return [];
    }
}
