# TODO: Add Editable Ads, Countdowns, Analytics, and Import/Export to Admin Panel

## Tasks
- [ ] Update src/lib/adFunnelConfig.ts to handle full config (pages, analytics) with DB persistence and localStorage fallback.
- [ ] Add server routes in server/routes/admin.js for config CRUD and analytics tracking.
- [ ] Create src/components/admin/AdManagement.tsx for CRUD ads (tabs for pages 1-4, add/edit/delete/reorder ads).
- [ ] Create src/components/admin/CountdownSettings.tsx for setting countdown per page.
- [ ] Create src/components/admin/AnalyticsDashboard.tsx for charts (pageVisits bar, adClicks bar/pie, totalDownloads counter) using Chart.js.
- [ ] Create src/components/admin/ImportExport.tsx for JSON import/export with validation.
- [ ] Update src/pages/Admin.tsx to include new sections: Ad Management, Countdown Settings, Analytics, Import/Export.
- [ ] Update src/pages/AdPage.tsx to record downloads on final click.
- [ ] Add DB table for downloads if needed (or use existing analytics).
- [ ] Test all features: Add ad, change countdown, view analytics, import/export.
- [ ] Update README with API endpoints and localStorage fallback info.
