# i.Go-rent Product Blueprint

This document is the working product logic blueprint for turning i.Go-rent into a production-level Lagos rental marketplace. It should be updated as product decisions become clearer.

## Product Purpose

i.Go-rent helps renters in Lagos safely book rental items from verified vendors, while helping vendors earn from their inventory with clearer protection against misuse, late returns, damage, and unclear item-condition claims.

The product should feel like a trust-first marketplace: clean UI, strong verification, clear item condition records, escrow-backed payments, delivery options, and a dispute process that protects both sides.

## Core Actors

### Renter

A renter searches for items, books them for specific dates, pays the rental fee plus security deposit, confirms item condition at receipt, uses the item responsibly, returns it, and receives the deposit back when the vendor confirms return and inspection.

### Vendor

A vendor completes higher-level KYC, lists rental items with detailed photos and condition notes, accepts bookings, prepares handover, confirms return condition, and receives rental proceeds after successful completion.

### Admin / Operations

The platform team handles KYC review, vendor approval, dispute resolution, risk flags, escrow monitoring, listing moderation, refund decisions, and support.

### Independent Logistics Provider

An independent logistics provider registers with i.Go-rent to handle item pickup and delivery when a renter selects i.Go-Logistics. The provider completes logistics KYC, supplies contact and vehicle details, receives assigned dispatch jobs, collects items from vendors, delivers items to renters, records proof of handover, and returns items where return logistics is requested.

### Escrow Provider: Blackcrow

Blackcrow should become the escrow transaction provider. i.Go-rent should create escrow transactions through the Blackcrow API, track escrow states locally, and only release or refund funds when the correct rental lifecycle event occurs.

## Legal And Acceptable Use

i.Go-rent must clearly warn all users that the app is only for lawful rental transactions involving legitimate goods and services. Renters, vendors, logistics providers, and any other users must not misuse the platform outside its intended rental-marketplace purpose.

Prohibited use should include:

- Listing, renting, transporting, funding, or facilitating illegal, stolen, counterfeit, restricted, dangerous, illicit, or unlawful goods.
- Using the app for money laundering, fraud, sanctions evasion, terrorist financing, bribery, identity misuse, or any transaction that violates applicable Nigerian law or other relevant laws.
- Using i.Go-Logistics or independent dispatch providers to move prohibited items.
- Misrepresenting item ownership, condition, value, identity, business registration, pickup location, or delivery destination.
- Creating fake bookings to move funds through escrow without a genuine rental transaction.

Operational rules:

- All users must accept the legal-use policy before completing signup and before checkout.
- The app should show a checkout warning that misuse may lead to cancellation, frozen escrow funds, account suspension, reporting to relevant authorities where required by law, and permanent removal from the platform.
- Vendors should confirm they own or are authorized to rent listed items.
- Renters should confirm the booking is for lawful use and within the normal rental purpose of the listed item.
- Logistics providers should confirm they will not knowingly transport prohibited goods and should be able to reject suspicious dispatches.
- Admin should be able to flag, pause, investigate, or cancel suspicious listings, users, bookings, dispatches, or escrow transactions.

## User Verification And KYC

Both renters and vendors should undergo KYC, but vendor KYC must be stricter because vendors are receiving money and supplying assets.

### Renter KYC

Minimum renter KYC should include:

- Full legal name.
- Phone number with OTP verification.
- Email verification.
- NIN.
- BVN for higher-value bookings or before first paid booking.
- Selfie or face match placeholder for later provider integration.
- Residential area in Lagos.
- Emergency contact for high-value rentals.

Renter KYC levels:

- Level 0: Account created, email only, can browse.
- Level 1: Phone verified, can save items and start checkout.
- Level 2: NIN verified, can book standard items.
- Level 3: BVN plus selfie verified, required for high-value rentals, repeated bookings, or flagged categories.

### Vendor KYC

Minimum vendor KYC should include:

- Full legal name.
- Phone number with OTP verification.
- Email verification.
- NIN.
- BVN.
- CAC registration number for registered businesses.
- Business name and address.
- Business category.
- Profile photo or business logo.
- Bank account verification.
- Pickup location or operating area.

Vendor KYC levels:

- Vendor Draft: Can create profile but cannot publish listings.
- Vendor Basic Verified: NIN, BVN, phone, and bank verified. Can list low-risk items.
- Vendor Business Verified: CAC and business address added. Can list higher-value inventory.
- Vendor Trusted: Strong completion record, low disputes, good ratings, and successful inspection history.

Renters should clearly see the vendor verification level before booking. Vendors should not be allowed to publish listings until the required vendor KYC level is met.

### Logistics Provider KYC

Independent logistics providers should have a dedicated account type and verification flow.

Minimum logistics KYC should include:

- Full legal name.
- Phone number with OTP verification.
- Email verification.
- NIN.
- BVN.
- Driver's license or rider permit where applicable.
- Vehicle type.
- Vehicle plate number.
- Vehicle photos.
- Service areas in Lagos.
- Emergency contact.
- Bank account verification for payouts.

Logistics provider levels:

- Logistics Draft: Can create profile but cannot receive dispatches.
- Logistics Verified: NIN, BVN, phone, license, vehicle, and bank verified. Can receive standard dispatches.
- Logistics Trusted: Strong completion record, low cancellation rate, good handover proof history, and high ratings.

## Marketplace Sections

### Home

The home screen should quickly communicate trust, rental categories, Lagos logistics, and escrow-backed booking. It should lead users into search, signup, or vendor onboarding without feeling like a generic landing page.

Main logic:

- Show featured categories such as Events, Transport, Gear, Tools, Fashion, and Spaces.
- Highlight verified vendors.
- Highlight escrow-backed payments and deposit protection.
- Surface popular Lagos rental zones.
- Encourage vendors to list items only after completing KYC.

### Authentication

Auth should support separate renter and vendor onboarding while allowing one account to eventually hold both roles if needed.

Main logic:

- User chooses Renter, Vendor, or Logistics Provider at signup.
- Renter signup asks for basic identity and contact details.
- Vendor signup asks for business and verification details.
- Logistics signup asks for identity, contact, vehicle, license, service area, and payout details.
- App blocks sensitive actions based on KYC level.
- Profile section shows verification status, missing requirements, and next steps.

### Browse / Search

Renters should be able to find available items quickly, especially from mobile.

Main logic:

- Search by item name, vendor name, category, Lagos area, and tags.
- Filter by category, price range, deposit range, delivery type, vendor verification level, rating, and availability date.
- Show item condition summary, daily price, deposit, vendor badge, and location.
- Hide or warn about listings from vendors that are not sufficiently verified.

### Listing Detail

The listing detail page is the trust contract before checkout.

Required listing information:

- Item title.
- Category.
- Daily rental price.
- Security deposit amount.
- Vendor name and verification badge.
- Pickup area.
- Delivery options.
- Clear description of what is included.
- Current item condition.
- Known defects, scratches, missing parts, age, and usage limits.
- Replacement value.
- Late return fee policy.
- Damage policy.
- Cancellation policy.
- Maximum rental duration.
- Photo gallery with up to 10 images.

Photo rules:

- Maximum 10 images per listing.
- Each image should have a capped upload size, recommended 2 MB to 5 MB per image.
- Images should be compressed or resized before upload where possible.
- Required images should include front view, side view, close-up condition shots, accessories, serial/model label if relevant, and any existing damage.

### Vendor Dashboard

Vendors need a focused operations dashboard, not just a listing form.

Main logic:

- Show KYC completion status.
- Block listing publishing until required KYC is complete.
- Create, edit, pause, and delete listings.
- Upload up to 10 listing photos.
- Record condition notes and existing defects.
- View bookings by status.
- Accept or reject booking requests if manual approval is enabled.
- Confirm item handover.
- Confirm returned and inspected.
- Submit damage claim against deposit if needed.
- View wallet, escrow releases, and pending payouts.
- View disputes and respond with evidence.

Vendor warnings:

- Vendors must clearly describe the item condition before renting.
- Vendors who omit known defects may lose dispute protection.
- Vendors who falsely claim damage risk account penalties and payout delays.
- Vendors should upload detailed photos before handover.

### Renter Dashboard

Renters should clearly see what they booked, what they owe, what deposit is held, and what actions are required.

Main logic:

- View upcoming, active, completed, cancelled, and disputed rentals.
- Confirm receipt of item.
- Confirm condition upon receipt.
- Upload receipt photos if condition differs from listing.
- Open dispute within a defined inspection window.
- Track deposit refund status.
- Rate vendor after completion.

Renter warnings:

- Renters are responsible for responsible item handling.
- Damage, missing accessories, late returns, or misuse can lead to partial or full deposit deduction.
- Renters should inspect and confirm item condition immediately at receipt.
- If condition differs from the listing, renters should report before use.

## Booking Lifecycle

### Booking States

Recommended booking states:

- Draft: Renter selected dates but has not paid.
- Pending Payment: Checkout started.
- Escrow Funded: Rental fee, deposit, and fees paid into escrow.
- Vendor Accepted: Vendor confirms item is available.
- Ready For Handover: Pickup or delivery is scheduled.
- Item Received: Renter confirms receipt.
- Active Rental: Rental period is ongoing.
- Return Pending: Rental end date reached or renter marked ready to return.
- Returned Under Inspection: Vendor is inspecting returned item.
- Completed: Vendor confirms item returned in acceptable condition.
- Deposit Refunded: Deposit returned to renter.
- Damage Claim Opened: Vendor requests deduction from deposit.
- Disputed: Renter or vendor opened a dispute.
- Cancelled: Booking cancelled under cancellation rules.

### Booking Flow

1. Renter chooses item and rental dates.
2. App checks availability.
3. Renter selects delivery type: Self-Pickup or i.Go-Logistics.
4. App calculates rental fee, security deposit, logistics fee, platform fee, and total payable.
5. Renter pays through checkout.
6. i.Go-rent creates a Blackcrow escrow transaction.
7. Funds move to escrow-funded state.
8. Vendor prepares item and confirms handover readiness.
9. Renter receives item and confirms condition.
10. Rental becomes active.
11. Renter returns item.
12. Vendor inspects item.
13. If item is fine, rental fee is released to vendor and deposit is refunded to renter.
14. If damage or issue exists, vendor opens a damage claim before release.
15. If renter accepts claim, agreed deduction is released and remaining deposit refunded.
16. If renter disputes claim, the dispute resolution process begins.

## Escrow / Blackcrow Integration Logic

i.Go-rent should treat escrow as a separate transaction layer, not just a local booking status.

### Escrow Records

Each booking should store:

- Local booking ID.
- Blackcrow transaction ID.
- Renter ID.
- Vendor ID.
- Listing ID.
- Rental fee amount.
- Security deposit amount.
- Delivery fee.
- Platform fee.
- Total paid.
- Escrow status.
- Release status.
- Refund status.
- Dispute status.
- Webhook event history.

### Escrow Events

The app should listen for Blackcrow webhook events such as:

- Escrow created.
- Payment received.
- Escrow funded.
- Release approved.
- Vendor payout sent.
- Deposit refund started.
- Deposit refund completed.
- Dispute opened.
- Dispute resolved.
- Transaction cancelled.
- Transaction failed.

### Escrow Release Rules

Rental fee should only be released to the vendor when:

- Payment is confirmed.
- Renter received item or handover evidence exists.
- Rental period is completed.
- Vendor confirms return and inspection.
- No active dispute exists.

Security deposit should only be refunded when:

- Vendor marks item returned and inspected.
- No damage claim exists.
- Dispute window has passed or renter/vendor both accept completion.

Deposit should be held when:

- Vendor opens a damage claim.
- Renter disputes item condition.
- Return is late.
- Item is missing accessories.
- Admin flags suspicious activity.

## Condition Confirmation

Condition confirmation should happen twice: before handover and upon receipt.

### Vendor Pre-Handover

Vendor must confirm:

- Item is available.
- Item matches listing photos.
- Accessories are complete.
- Known defects are disclosed.
- Current condition has not changed since listing.
- Handover photos are uploaded for high-value items.

### Renter Receipt Confirmation

Renter must confirm:

- Item was received.
- Photos match actual item.
- Accessories are complete.
- Condition matches the listing.
- Any difference is reported before use.

If the renter does not confirm condition within the receipt window, the app should send reminders and then apply the platform's default rule, such as "received without objection" unless delivery evidence contradicts it.

## Dispute Resolution

Disputes should protect both sides and be evidence-driven.

### Dispute Triggers

A dispute can be opened when:

- Renter says item condition differs from listing.
- Vendor claims item was damaged.
- Item is returned late.
- Accessories are missing.
- Delivery was not completed.
- Vendor fails to hand over item.
- Renter fails to return item.
- Payment or refund issue occurs.

### Dispute Evidence

Evidence should include:

- Listing photos.
- Vendor pre-handover photos.
- Renter receipt photos.
- Return inspection photos.
- Chat messages.
- Delivery confirmation.
- Timestamped condition checklist.
- Item serial number or unique identifier.
- Admin notes.

### Dispute Flow

1. Dispute is opened by renter or vendor.
2. Deposit and payout are paused in escrow.
3. Both parties are notified.
4. App asks for evidence and explanation.
5. Counterparty gets a response window.
6. Admin reviews timeline, evidence, listing condition, and policy.
7. Admin selects resolution:
   - Full refund to renter.
   - Full release to vendor.
   - Partial deposit deduction.
   - Cancellation refund.
   - Account warning or suspension.
8. Blackcrow escrow is updated with the final release/refund instruction.
9. Booking is marked resolved.

### Dispute Windows

Recommended windows:

- Renter receipt dispute: within 2 to 6 hours after receipt, depending on category.
- Vendor return inspection: within 12 to 24 hours after return.
- Late return claim: automatic once return deadline passes.
- Admin response target: within 24 to 72 hours.

## Logistics

Delivery type should be part of checkout.

Options:

- Self-Pickup: renter and vendor coordinate pickup.
- i.Go-Logistics: platform-arranged logistics with flat or distance-based fee.

### Independent Logistics Provider Accounts

i.Go-rent should allow approved independent logistics providers to create accounts and operate inside a dedicated logistics dashboard.

Logistics dashboard logic:

- Show verification status and missing KYC requirements.
- Show assigned pickup and delivery jobs.
- Show vendor pickup contact details after dispatch assignment.
- Show renter delivery contact details after dispatch assignment.
- Show item title, booking reference, pickup area, delivery area, pickup window, delivery window, and dispatch fee.
- Let provider accept or reject assigned dispatches within a response window.
- Let provider mark "Arrived at vendor", "Item collected", "Delivered to renter", and "Return collected" where applicable.
- Require photo proof, OTP, QR, or signature confirmation for item collection and delivery.
- Let provider raise an issue if item details, package condition, address, or user behavior looks suspicious.

### i.Go-Logistics Dispatch Logic

When vendor and renter agree to use i.Go-Logistics:

1. Renter selects i.Go-Logistics during checkout.
2. App calculates the logistics fee and includes it in the booking payment.
3. Renter completes payment and escrow is funded.
4. App creates or updates the dispatch record for the booking.
5. App selects an internal or independent logistics provider registered with the app based on coverage area, verification level, availability, vehicle type, item size, and reliability score.
6. App assigns the dispatch to the selected provider.
7. App sends the logistics provider's details to both vendor and renter:
   - Provider name.
   - Phone number.
   - Email where available.
   - Vehicle type.
   - Plate number where available.
   - Dispatch reference.
   - Pickup window.
   - Delivery window.
8. Vendor receives renter and logistics handover instructions.
9. Renter receives vendor and logistics delivery instructions.
10. Logistics provider confirms acceptance.
11. Logistics provider arrives at vendor pickup location.
12. Vendor confirms the item condition and releases item to provider.
13. Logistics provider captures pickup proof.
14. Logistics provider delivers item to renter.
15. Renter confirms receipt and item condition.
16. Booking moves into active rental state.
17. For return logistics, the same or another provider is assigned to collect item from renter and return it to vendor.
18. Vendor inspects returned item and either completes the booking or opens a damage claim.

Dispatch states:

- Not Required: Self-Pickup selected.
- Pending Assignment: i.Go-Logistics selected but provider not assigned.
- Assigned: Provider selected and details sent to vendor and renter.
- Accepted By Provider: Provider accepted the job.
- Pickup In Progress: Provider is going to vendor.
- Collected From Vendor: Provider has item and pickup proof is recorded.
- Delivered To Renter: Renter has received item.
- Return Pickup Scheduled: Return movement is planned.
- Returned To Vendor: Provider returned item to vendor.
- Dispatch Completed: Logistics work is complete.
- Dispatch Issue: Provider, vendor, or renter reported a delivery issue.
- Cancelled: Dispatch was cancelled.

Dispatch data should store:

- Booking ID.
- Listing ID.
- Vendor ID.
- Renter ID.
- Logistics provider ID.
- Provider contact details snapshot.
- Pickup address or area.
- Delivery address or area.
- Pickup window.
- Delivery window.
- Return pickup window where applicable.
- Dispatch fee.
- Dispatch status.
- Proof of pickup.
- Proof of delivery.
- Proof of return.
- Issue notes.
- Audit trail of status changes.

Future logistics logic:

- Pickup address hidden until booking is paid.
- Delivery proof required for i.Go-Logistics.
- Rider handover photos.
- QR or OTP code for handover confirmation.
- Delivery fee can vary by Lagos area, item size, and urgency.
- Suspicious dispatches can be paused by admin before pickup or while escrow remains held.

## Ratings And Trust

Trust should be built from behavior, not only KYC.

Signals:

- Vendor verification level.
- Renter verification level.
- Completed bookings.
- Dispute rate.
- Cancellation rate.
- Late return rate.
- Damage claim rate.
- Average rating.
- Response time.
- Quality of listing condition details.

Badges:

- Verified Vendor.
- Business Verified.
- Trusted Vendor.
- Fast Responder.
- Low Dispute Rate.
- High-Value Approved.

## Data Model Direction

The database should support:

- Users.
- User roles.
- KYC profiles.
- Vendor profiles.
- Renter profiles.
- Logistics provider profiles.
- Listings.
- Listing images.
- Categories.
- Availability calendars.
- Bookings.
- Booking status history.
- Escrow transactions.
- Payments.
- Delivery records.
- Dispatch assignments.
- Condition reports.
- Disputes.
- Dispute evidence.
- Reviews.
- Notifications.
- Admin audit logs.

Important relationships:

- One user can have renter and vendor roles.
- One vendor can have many listings.
- One listing can have many images.
- One listing can have many bookings.
- One booking has one escrow transaction.
- One booking can have one delivery record.
- One delivery record can have one assigned logistics provider.
- One booking can have multiple condition reports.
- One booking can have one or more disputes.
- One dispute can have many evidence files.

## Product-Level Success Flow

The first complete production-level milestone should allow:

1. User creates vendor account.
2. Vendor completes required KYC.
3. Vendor lists "Professional Sound System" with price, deposit, condition notes, and up to 10 photos.
4. User creates renter account.
5. Renter completes required KYC.
6. Renter searches for the sound system.
7. Renter views vendor verification and item condition.
8. Renter selects rental dates and delivery type.
9. Renter pays rental fee plus deposit.
10. App creates Blackcrow escrow transaction.
11. If i.Go-Logistics is selected, app assigns a verified logistics provider and shares dispatch details with vendor and renter.
12. Vendor confirms handover.
13. Renter confirms item condition on receipt.
14. Renter returns item.
15. Vendor marks item returned and inspected.
16. Rental fee is released to vendor.
17. Deposit is refunded to renter.
18. Both parties can review each other.

## Open Product Decisions

These should be decided before implementation:

- Which KYC provider will verify NIN, BVN, CAC, phone, and bank account?
- Will all bookings require vendor approval, or only high-value bookings?
- What is the minimum renter KYC level before payment?
- What is the minimum vendor KYC level before publishing?
- What categories are considered high-risk?
- What is the default dispute window per category?
- Should i.Go-Logistics start as a flat fee or area-based pricing?
- What platform fee should i.Go-rent charge?
- How should Blackcrow split rental fee, deposit, logistics fee, and platform fee?
- Should vendors receive payouts instantly after release, or in scheduled payout batches?
- What maximum upload size should be enforced per image?
- Should high-value listings require serial numbers or proof of ownership?
- What minimum KYC level should logistics providers need before receiving dispatches?
- Should i.Go-Logistics start with internal dispatch only, independent providers only, or a hybrid model?
- Should logistics providers be able to see exact addresses only after accepting a dispatch?
- What proof should be mandatory for logistics pickup and delivery: OTP, photo, signature, QR, or all of them?

## Current Product Direction

The current UI should remain the visual foundation. Future implementation should build around the existing fintech-meets-lifestyle style: deep navy, vibrant teal, clean white surfaces, mobile-first screens, strong trust signals, and clear marketplace actions.

The next build phase should focus on replacing demo-only behavior with real product logic in small, testable increments:

1. Durable database-backed auth and roles.
2. KYC profile and verification states.
3. Real listing creation with multi-image upload.
4. Availability-aware booking flow.
5. Blackcrow escrow API integration.
6. Condition confirmation and dispute flows.
7. Admin review tools.
8. Production deployment checks.
