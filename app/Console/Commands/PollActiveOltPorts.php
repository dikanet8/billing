<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Models\OltDevice;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\OltController;
use App\Events\OltPortDataUpdated;
use App\Events\OltUncfgDataUpdated;

#[Signature('olt:poll-active-ports')]
#[Description('Polls active OLT ports and unconfigured ONUs and broadcasts the data via WebSockets')]
class PollActiveOltPorts extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting OLT active ports polling daemon...");
        $controller = app(OltController::class);

        while (true) {
            $olts = OltDevice::all();
            foreach ($olts as $olt) {
                // Poll unconfigured ONUs if active
                if (Cache::get("olt_watch_{$olt->id}_uncfg")) {
                    try {
                        $res = $controller->getGponUncfg($olt->id)->getData(true);
                        if (isset($res['data'])) {
                            event(new OltUncfgDataUpdated($olt->id, $res['data']));
                        }
                    } catch (\Exception $e) {
                        $this->error("Error polling uncfg for OLT {$olt->id}: " . $e->getMessage());
                    }
                }

                // Poll active ports
                $ports = Cache::get("olt_{$olt->id}_active_ports", []);
                if (!is_array($ports)) {
                    $ports = [];
                }
                $ports = array_filter($ports, function($t) { return is_numeric($t) && time() - $t < 15; });
                
                // Save back cleaned up array
                Cache::put("olt_{$olt->id}_active_ports", $ports, now()->addMinutes(1));

                foreach ($ports as $portIndex => $lastActive) {
                    try {
                        $res = $controller->getOnus($olt->id, $portIndex, true)->getData(true);
                        if (isset($res['data'])) {
                            event(new OltPortDataUpdated($olt->id, $portIndex, $res['data']));
                        }
                    } catch (\Exception $e) {
                        $this->error("Error polling port {$portIndex} for OLT {$olt->id}: " . $e->getMessage());
                    }
                }
            }

            sleep(10);
        }
    }
}

