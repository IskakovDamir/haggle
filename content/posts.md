# Haggle post drafts

Drafts for X and LinkedIn, built from `src/lib/benchmarks/data.ts` (checked Nov 14, 2026). Every number below appears on the linked page with the same label or source. Estimates say "our estimate". Each post has a matching image from `/api/og/stat`.

Base URL: `https://haggle-pi.vercel.app`. Swap it if the site moves.

The brief wanted to open with "Only 23% of cardholders ever asked for a lower rate." That figure is not in the article we cite, and LendingTree's own page blocks automated checks, so these drafts leave it out. If someone confirms it on lendingtree.com, add it to the dataset first and then to the posts.

## X

### X 1: lower rate

84% of cardholders who asked their bank for a lower credit card rate got one, and the average cut was 6.3 percentage points (LendingTree survey, Sep 2026).

The average APR on cards charged interest is 22.36% (Federal Reserve, Aug 2026). The call is worth making.

How each big bank compares: https://haggle-pi.vercel.app/insights/lower-apr

Image: `/api/og/stat?id=market-apr-ask-success`

### X 2: missed payment

92% of people who asked to have a credit card late fee waived got it (LendingTree survey, Sep 2026).

A big issuer can charge up to $30 for a first late payment and $41 for a repeat. If you missed a payment, ask for it back.

What happens day by day after a missed payment: https://haggle-pi.vercel.app/insights/missed-payment

Image: `/api/og/stat?id=market-late-fee-waived`

### X 3: the Chase hold

How long is the hold at Chase? GetHuman says 4 minutes, from 783 calls on the international card line. DoNotPay says 20 minutes on the main line.

Nobody measures this properly, so we will. Our estimate for reaching a person is 9 minutes until our own calls measure it.

https://haggle-pi.vercel.app/insights/chase

Image: `/api/og/stat?id=chase-hold-donotpay`

## LinkedIn

### LinkedIn 1: the call nobody makes

84% of cardholders who asked for a lower credit card rate got one. The average cut was 6.3 percentage points. That is from LendingTree's survey published in September 2026.

Meanwhile Americans carry $1.285 trillion in credit card balances (New York Fed, Q3 2026), and the average APR on accounts charged interest is 22.36% (Federal Reserve G.19, August 2026).

Banks keep retention teams for exactly this call. The hard part is the call itself: the hold music, the menu, knowing what to ask for.

We built Haggle to make that call. We also put together a page that compares Chase, Capital One, Citi, Amex and Discover. Every number on it either links to its source or is marked as our estimate, and the estimates get replaced as our own calls measure them.

https://haggle-pi.vercel.app/insights/lower-apr

Image: `/api/og/stat?id=market-apr-ask-success`

### LinkedIn 2: after a missed payment

92% of people who asked to have a credit card late fee waived got it (LendingTree survey, September 2026).

Here is what happens after a missed payment, per federal rules:
- The issuer can charge a late fee, up to $30 the first time at a big issuer and $41 for a repeat.
- After about 30 days, the late payment is reported to the credit bureaus and your score may drop (CFPB).
- Only after more than 60 days can a penalty rate hit the balance you already have, and six on-time payments in a row bring it back down (12 CFR 1026.55).

Most of the damage is avoidable if you call early. Our estimates put late fee refund rates between 85% and 96% across five big banks. These are estimates, labelled as such on the page, until our own calls measure them.

https://haggle-pi.vercel.app/insights/missed-payment

Image: `/api/og/stat?id=market-late-fee-waived&format=portrait`
