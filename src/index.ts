import FlitwareBase from "@/Client";

export * from "@/Client";
export * from "@/ClientResponseError";
export * from "@/services/CollectionService";
export * from "@/services/HealthService";
export * from "@/services/LogService";
export * from "@/services/RealtimeService";
export * from "@/services/RecordService";
export * from "@/services/CrudService";
export * from "@/services/BatchService";
export * from "@/stores/AsyncAuthStore";
export * from "@/stores/BaseAuthStore";
export * from "@/stores/LocalAuthStore";
export * from "@/tools/dtos";
export * from "@/tools/options";
export * from "@/tools/cookie";
export * from "@/tools/jwt";

// Recommended Flitware Base entry points:
//
//   import FlitwareBase from "@flitware/base";
//   import { FlitwareBase } from "@flitware/base";
export { FlitwareBase };

// Compatibility alias easing migration from `pocketbase@0.26.1`
// (same class object, no behavioral difference):
//
//   import { PocketBase } from "@flitware/base";
export { FlitwareBase as PocketBase };

export default FlitwareBase;
