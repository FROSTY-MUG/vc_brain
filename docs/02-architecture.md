# How the Pieces Fit Together (Architecture)

Imagine a restaurant. You have the dining room where customers sit (the Frontend), the kitchen where food is prepared (the Backend), and the giant pantry where ingredients are stored (the Database).

Here is how our restaurant is set up:

```text
[ You (The Customer) ]
        |
        v
[ The Dining Room (Vercel) ] --- This is the visual website you see and click on.
        |
        +---> The Waiter (API Routes) --- Carries your requests to the kitchen.
        |
        v
[ The Kitchen (Railway) ] --- This is where the heavy lifting and thinking happens.
        |
        v
[ The Pantry (Supabase) ] --- This is where all the user profiles and messages are stored safely.
```

## Why We Built It This Way
1. **Speed is Everything**: Just like you want your food fast, we want the website to load instantly. We save a mini-copy of your data directly on your device (your browser) so the page appears the very second you open it.
2. **The Waiter System**: Sometimes, security rules on the internet try to block the dining room from talking directly to the kitchen. We use a "Waiter" (a proxy) to safely pass notes back and forth without getting blocked.
3. **The Big Pantry**: We use a professional storage system called Supabase. It’s like a massive, secure filing cabinet in the cloud that never runs out of space.
