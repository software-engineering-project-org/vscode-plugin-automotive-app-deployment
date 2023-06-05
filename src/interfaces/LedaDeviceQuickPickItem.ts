import { QuickPickItem } from "vscode";
import { LedaDevice} from "./LedaDevice";

export interface LedaDeviceQuickPickItem 
    extends QuickPickItem, LedaDevice {}