import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createContyApi } from "../../index";

const OPERATIONS: Record<string, string> = {
  "GET /campaigns": "campaigns.list",
  "GET /campaigns/{id}": "campaigns.get",
  "GET /campaigns/{id}/stages": "campaigns.stages",
  "GET /campaigns/{id}/items": "campaigns.items",
  "POST /campaigns/validate": "campaigns.validate",
  "POST /campaigns": "campaigns.create",
  "PATCH /campaigns/{id}": "campaigns.update",
  "POST /campaigns/{id}/status": "campaigns.setStatus",
  "DELETE /campaigns/{id}": "campaigns.remove",
  "POST /campaigns/{id}/renew": "campaigns.renew",
  "GET /campaigns/{id}/publish-cost": "campaigns.publishCost",
  "GET /campaigns/{id}/briefings": "campaigns.briefings",
  "GET /campaigns/proposal-suggestions": "campaigns.proposalSuggestions",
  "POST /campaigns/{id}/briefings/attachments": "campaigns.attachBriefingFile",
  "POST /uploads": "uploads.create",
  "POST /uploads/import": "uploads.import",
  "GET /me": "me.get",
  "POST /campaigns/{id}/applications/{application_id}/approve": "applications.approve",
  "POST /campaigns/{id}/applications/{application_id}/reject": "applications.reject",
  "POST /campaigns/{id}/applications/{application_id}/restore": "applications.restore",
  "POST /campaigns/{id}/applications/bulk": "applications.bulk",
  "PATCH /campaigns/{id}/applications/{application_id}/proposed-deadline":
    "applications.setProposedDeadline",
  "PATCH /campaigns/{id}/applications/{application_id}/proposed-amount":
    "applications.setProposedAmount",
  "PATCH /campaigns/{id}/creators/{creator_id}/scope-option": "campaigns.creators.setScopeOption",
  "PATCH /campaigns/{id}/creators/{creator_id}/briefing": "campaigns.creators.setBriefing",
  "PATCH /campaigns/{id}/creators/{creator_id}/scope-amount": "campaigns.creators.setScopeAmount",
  "POST /campaigns/{id}/creators/bulk/exclude": "campaigns.creators.bulkExclude",
  "POST /campaigns/{id}/missions/bulk-status": "missions.bulkStatus",
  "POST /missions/approve-pending": "missions.approvePending",
  "POST /missions/bulk/deadline": "missions.bulkDeadline",
  "POST /missions/bulk/send": "missions.bulkSend",
  "POST /missions/bulk/remove": "missions.bulkRemove",
  "GET /missions/{id}": "missions.get",
  "POST /missions/{id}/approve": "missions.approve",
  "POST /missions/{id}/request-changes": "missions.requestChanges",
  "POST /missions/{id}/reject": "missions.reject",
  "POST /missions/{id}/assets/{asset}/review": "missions.reviewAsset",
  "PATCH /missions/{id}/asset-version": "missions.setAssetVersion",
  "PATCH /missions/{id}/deadline": "missions.setDeadline",
  "POST /missions/{id}/send": "missions.send",
  "POST /missions/{id}/restore": "missions.restore",
  "GET /missions/{id}/reinvite-eligibility": "missions.reinviteEligibility",
  "POST /missions/{id}/reinvite": "missions.reinvite",
  "DELETE /missions/{id}": "missions.remove",
  "POST /mission-combos/{id}/status": "missionCombos.setStatus",
  "GET /bulk-jobs/{id}": "bulkJobs.get",
  "POST /post-checks/accept": "postChecks.accept",
  "POST /missions/{id}/product-shipment": "missions.shipProduct",
  "GET /missions/{id}/product-shipment": "missions.productShipment",
  "PUT /missions/{id}/post-url": "missions.setPostUrl",
  "PUT /missions/{id}/posted-at": "missions.setPostedAt",
  "POST /missions/{id}/post-check/accept": "missions.acceptPostCheck",
  "POST /missions/{id}/coupon": "missions.createCoupon",
  "GET /missions/{id}/comments": "missions.comments.list",
  "POST /missions/{id}/comments": "missions.comments.create",
  "GET /missions/{id}/script-file": "missions.scriptFile",
  "GET /missions/{id}/delivery-download": "missions.deliveryDownload",
  "POST /missions/{id}/notify": "missions.notify",
  "POST /missions/{id}/sync-metrics": "missions.syncMetrics",
  "GET /campaigns/{id}/export": "campaigns.export",
  "GET /campaigns/{id}/coupon-pool": "campaigns.coupons.pool.list",
  "POST /campaigns/{id}/coupon-pool": "campaigns.coupons.pool.add",
  "POST /campaigns/{id}/coupons/bulk": "campaigns.coupons.bulk",
  "POST /campaigns/{id}/coupon-commission/budget": "campaigns.coupons.setCommissionBudget",
  "GET /campaigns/{id}/coupon-sales": "campaigns.coupons.sales",
  "POST /campaigns/{id}/sync-metrics": "campaigns.syncMetrics",
  "GET /campaigns/{id}/sync-metrics/jobs/{job_id}": "campaigns.syncMetricsJob",
  "GET /campaigns/{id}/tracking": "campaigns.tracking",
  "PUT /campaigns/{id}/tracking/destination": "campaigns.setTrackingDestination",
  "POST /campaigns/{id}/short-links": "campaigns.shortLinks.create",
  "GET /campaigns/{id}/creator-invoices": "campaigns.creatorInvoices",
  "GET /campaigns/{id}/counts": "campaigns.counts",
  "GET /campaigns/{id}/segments": "campaigns.segments",
  "GET /campaigns/{id}/suggestions": "campaigns.suggestions",
  "GET /campaigns/{id}/ai-rubric": "campaigns.aiRubric.get",
  "PUT /campaigns/{id}/ai-rubric": "campaigns.aiRubric.set",
  "GET /campaigns/{id}/results": "campaigns.results.overview",
  "GET /campaigns/{id}/results/timeseries": "campaigns.results.timeseries",
  "GET /campaigns/{id}/results/creators": "campaigns.results.creators",
  "GET /campaigns/{id}/results/creators/{creator_id}/deliveries": "campaigns.results.deliveries",
  "GET /campaigns/{id}/results/traffic": "campaigns.results.traffic",
  "GET /campaigns/{id}/results/traffic/events": "campaigns.results.trafficEvents",
  "PUT /conversion-events": "conversionEvents.set",
};

const PENDING = new Set([
  "POST /coupons",
  "GET /coupons",
  "GET /coupons/{id}",
  "PATCH /coupons/{id}",
  "POST /coupons/{id}/assign",
  "POST /coupons/{id}/unassign",
  "PUT /coupons/{id}/sales/{external_id}",
  "GET /coupons/{id}/sales",
  "POST /campaigns/{id}/creators/{creator_id}/messages",
  "GET /conversations",
  "GET /conversations/{id}/messages",
]);

const GENERATED_IDEMPOTENCY_KEY = [
  "POST /campaigns",
  "POST /campaigns/{id}/renew",
  "POST /campaigns/{id}/briefings/attachments",
  "POST /uploads/import",
  "POST /campaigns/{id}/applications/bulk",
  "POST /campaigns/{id}/creators/bulk/exclude",
  "POST /missions/approve-pending",
  "POST /missions/bulk/deadline",
  "POST /missions/bulk/send",
  "POST /missions/bulk/remove",
  "POST /missions/{id}/reinvite",
  "POST /missions/{id}/coupon",
  "POST /missions/{id}/comments",
  "POST /campaigns/{id}/coupon-pool",
  "POST /campaigns/{id}/coupons/bulk",
  "POST /campaigns/{id}/coupon-commission/budget",
  "POST /campaigns/{id}/short-links",
];

const METHODS = ["get", "post", "patch", "put", "delete"] as const;

interface Operation {
  parameters?: { name: string; in: string; required?: boolean }[];
}

function fixtureDocument() {
  const url = new URL("../../../../../test/fixtures/openapi.json", import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as {
    paths: Record<string, Partial<Record<(typeof METHODS)[number], Operation>>>;
  };
}

function fixtureOperations(): [string, Operation][] {
  return Object.entries(fixtureDocument().paths).flatMap(([path, operations]) =>
    METHODS.flatMap((method) => {
      const operation = operations[method];
      return operation
        ? [[`${method.toUpperCase()} ${path}`, operation] as [string, Operation]]
        : [];
    }),
  );
}

describe("public API coverage", () => {
  const client = createContyApi({ apiKey: "ck_live_coverage" }) as unknown as Record<
    string,
    unknown
  >;

  it("has a client method or a pending entry for every operation in openapi.json", () => {
    const missing = fixtureOperations()
      .map(([operation]) => operation)
      .filter((operation) => !(operation in OPERATIONS) && !PENDING.has(operation));
    expect(missing).toEqual([]);
  });

  it("generates Idempotency-Key exactly where openapi.json requires it", () => {
    const required = fixtureOperations()
      .filter(([, operation]) =>
        (operation.parameters ?? []).some(
          (parameter) =>
            parameter.in === "header" &&
            parameter.name.toLowerCase() === "idempotency-key" &&
            parameter.required === true,
        ),
      )
      .map(([operation]) => operation);
    expect(required.sort()).toEqual([...GENERATED_IDEMPOTENCY_KEY].sort());
  });

  it("exposes every mapped method", () => {
    for (const method of Object.values(OPERATIONS)) {
      const target = method
        .split(".")
        .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], client);
      expect(typeof target, method).toBe("function");
    }
  });
});
