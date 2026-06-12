# Nectar — Founder Audit & Forward Plan

**Date:** June 12, 2026
**Inputs:** nectar-viz codebase + git history, Nectar overview deck, Shoppable Pinterest vision doc (May 2026), original AI Pinterest doc (Oct 2024), Delhi Brass brand doc, 3 customer calls (Kavita Singh — designer, Chetna Jain — architect, Geetankali — Kasauli villa client), PostHog instrumentation.

---

## 1. What exists today

### Product (live)
- Mobile-first web app on Vercel: upload a room photo → pick a product (or "AI Pick" recommends 3) → photorealistic Gemini render of the product in the actual room.
- **531 products across 4 brands**: Delhi Brass (199), CasaGold (172), FIG Living (137), House of Samavar (23). Images on ImageKit.
- Furnished vs. under-construction modes, room types (incl. mandir, bar), curated vibe prompts (Indian Maximalist, Art Deco, etc.).
- Full analytics funnel (PostHog + Vercel), generation logging to Blob with an internal `/review` page for QA — a real eval loop.
- No auth, no payments, no lead capture. Visual search ("Inspire") built but hidden.

### Research signal (3 calls, all trade-side)
| Who | Key takeaway |
|---|---|
| Kavita Singh (designer, 25 yrs) | Consultants hired for lumen/wattage math; AI agent + product recommender both useful; lighting must be planned at construction stage |
| Chetna Jain (architect) | Tool valuable as a time-saver, but full adoption needs RCP overlays, BOQ with rates, drivers, circuiting → aligned that it's a **supportive tool, not a consultant replacement** |
| Geetankali (villa client, Scapes 1842, 39 villas) | Very positive on free AI lighting consultant; pays Neil Das **₹1–2L + travel per project**; he does **not source lights**; will share a real lighting plan as reference spec and test the tool |

### Unfair advantages
1. **Delhi Brass** (family business, est. 1947): 199-product catalog, two showrooms with daily affluent foot traffic, manufacturing, and decades of designer/architect relationships in NCR.
2. Three working AI pipelines already validated: render quality (spike tests passed), recommendation, and the trust of real trade users willing to give feedback.

---

## 2. The honest assessment

**You are currently three companies at once:**
1. B2C "shoppable Pinterest" (the deck + vision docs)
2. B2B in-store visualizer for brands (what's actually built)
3. AI lighting consultant for the trade (what the calls are about)

**Every piece of demand evidence you have is trade-side.** All three calls are designers/architects/project clients. Zero consumer interviews. The shoppable-Pinterest consumer play is the most crowded, most capital-hungry, least-validated of the three (Modsy died doing this; Pinterest/Houzz own discovery). Park it.

**The economics live in the lighting wedge:**
- Wrong-size lighting is the #1 stated regret (your own deck) — and the Geetankali call confirms contractors over-light when unsupervised.
- A human lighting consultant costs ₹1–2L per villa, does 1–3 site visits, and **leaves money on the table: he doesn't source fixtures**. Sourcing is exactly what Delhi Brass does.
- Chetna told you precisely where the cliff is: circuits, drivers, RCP CAD integration. That's lighting-engineering software — a multi-year build for a tiny market. **Do not go there.** The "supportive tool" scope she agreed to is the right product.

**Verdict:** Nectar is a **trade tool that sells lights**, not a consumer app. The visualizer + sizing + lighting-plan-lite stack makes designers faster and makes showroom customers confident — and every render ends in a purchasable SKU. Monetization is product margin first, SaaS later.

---

## 3. Who is the market

**Primary ICP:** independent interior designers & small architecture studios in Delhi NCR doing 2–10 residential projects/year. They specify lighting, they don't want to pay ₹1–2L per project for a consultant, and they already buy from Delhi Brass-type vendors.

**Secondary:** boutique developers / project clients (the Scapes 1842 pattern — 39 villas, repeat purchases, add-on furnishing packages). One relationship = dozens of rooms.

**Tertiary (reached *through* the first two, not directly):** affluent homeowners renovating — they arrive via showroom QR codes and designer-shared renders. Do not spend to acquire them directly yet.

Strategy doc already says it: niche down, get 100 power users, no social-media marketing. The niche is **NCR lighting trade**. Stay there until it's won.

## 4. How to reach them (zero ad spend)

1. **Showroom as funnel** — QR at both Delhi Brass showrooms + staff-assisted flow. The walk-in form and contacts sheet already exist; wire the tool into them.
2. **Founder-led designer outreach** — revive the "digital lookbook → 50 top firms" play, but lead with the tool, not the catalog: "Send me a room photo and a vibe, I'll send back 3 purchasable options rendered in the room, with the right size."
3. **Work the warm pipeline** — Chetna offered to circulate to her architect group; Geetankali is testing the tool and sending Neil Das's actual plan (your free spec for the agent). Ask every happy designer for 2 introductions.
4. **Renders as marketing** — every shared render should carry a subtle watermark + link. WhatsApp share already exists; this is the viral loop in this market.
5. **Scapes 1842 as the case study** — do the clubhouse + Villas 25/33 lighting hands-on with the tool. "Lighting plan + sourcing for a 39-villa project" is the story that opens every developer door.

## 5. Business model (sequence, don't stack)

1. **Now:** tool free; monetize Delhi Brass sales it generates. Track attributed revenue — this is your traction metric and the proof for everything later.
2. **Next (3–6 mo):** formalize commission on partner brands already in the catalog (CasaGold, FIG Living, House of Samavar) — affiliate/commission per attributed sale.
3. **Later (6–12 mo):** designer pro tier (₹2–5k/mo: saved client projects, branded presentations, BOQ export) once ≥10 designers use it weekly for free. Then brand SaaS for other lighting retailers — the Delhi Brass case study is the sales deck.

## 6. Build before "launch" (in order)

"Launch" = official Delhi Brass showroom rollout + 10 designers actively using it. Not an app-store moment.

1. **Sizing recommendations** (diameter / height / hang-height from product specs + room photo) — already promised to Geetankali, cheap to build, the single most differentiating feature, and the bridge to the lighting agent.
2. **Lead capture** — name + WhatsApp before/at render delivery. Renders with no contact = wasted demand. Feed the existing contacts sheet.
3. **Reliability bar** — use the `/review` page to build a 30-room eval set; ship only when ≥80% of renders are showable without retry. One bad render in front of a designer costs the relationship.
4. **Shareable render page** — branded link with product name, dimensions, price, "enquire on WhatsApp." Closes the loop from render → sale.
5. **Lightweight designer projects** — save multiple renders per client under a named project (even just persistent links). This is what makes designers return weekly.
6. **Lighting agent v0.5, scoped to "supportive tool"**: floor-plan upload → room-by-room fixture suggestions + fixture schedule + BOQ with editable rates + shoppable catalog matches. Use Neil Das's plan as the quality benchmark. **Explicitly exclude** circuits, drivers, exterior, RCP CAD overlays.

**Do NOT build now:** consumer iOS app, visual search/Inspire, multi-brand self-serve onboarding, AR, anything CAD.

## 7. 90-day plan

- **Weeks 1–2:** Sizing feature + lead capture. Send tool to Geetankali. Define render eval set.
- **Weeks 3–6:** Showroom rollout (QR + staff training + attribution tracking). Outreach to 25 designers, demo to 10.
- **Weeks 7–12:** Shareable render pages + designer projects. Lighting agent v0.5 prototype against the Neil Das reference plan; test with Kavita, Chetna + 5 new designers. 15 more trade interviews.
- **Day 90 checkpoint:** ≥10 weekly-active designers, ≥1 attributed Delhi Brass sale/week, render success ≥80%. Hit → raise/expand to more NCR brands. Miss → the calls will tell you which assumption broke.

## 8. North-star metrics

1. Attributed product sales per week (the business)
2. Weekly-active designers (the moat)
3. Render → share/download rate (product quality proxy; already instrumented)
4. Renders per returning user (habit formation)

---

*Customer call notes now live in `docs/customer-calls/`. Add every new call there — the pattern across calls is the strategy.*
