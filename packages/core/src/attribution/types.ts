import type { UTM } from "../config/constants";

export type UtmKey = (typeof UTM.keys)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export interface Attribution {
  utm: Utm;
  expires_at: number;
}
