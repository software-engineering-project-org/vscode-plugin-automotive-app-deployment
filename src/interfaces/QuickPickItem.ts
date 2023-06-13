import { QuickPickItem } from "vscode";
import { LedaDevice} from "./LedaDevice";
import { PackageVersion } from "./GitHubTypes";

export interface LedaDeviceQuickPickItem 
    extends QuickPickItem, LedaDevice {}

export interface PackageQuickPickItem 
    extends QuickPickItem,  PackageVersion {}