# How We Built This (Implementation Tutorial)

Want to know the story of how Cognis came to life? Here is the step-by-step journey of how we put the pieces together in plain English.

## Step 1: Laying the Foundation
First, we created the "empty rooms" of our digital house. We set up a folder for the **Frontend** (the visual stuff you click) and a folder for the **Backend** (the brain that does the math).

## Step 2: Painting the Walls (The Visuals)
We wanted the app to look futuristic and sleek, like a radar screen. 
- We used a tool called **Tailwind** to paint the backgrounds dark and add bright neon green and purple glowing text.
- We built the "Start Menu" and "Radar Screen" so that founders and investors have a beautiful place to hang out.

## Step 3: Connecting the Brain (The Backend)
A pretty website isn't useful if it can't think. 
- We built an invisible engine in Python. 
- We taught the engine how to remember who is logged in, and how to match a founder looking for $500,000 with an investor who wants to spend $500,000.

## Step 4: The Live Data Magic (The Coolest Part!)
We noticed that refreshing the page to see new startups was annoying. So, we wrote a special rule:
- "Every 15 seconds, silently ask the brain if it found any new companies."
- If the brain says "Yes!", we instantly slide the new company onto your screen. It looks just like a live news ticker!

## Step 5: Hosting it on the Internet
Finally, we had to put it on the internet so people outside our house could see it.
- We put the visual website on **Vercel** (a super-fast hosting service).
- We put the invisible brain on **Railway** (a heavy-duty powerhouse).
- We told them to talk to each other securely. 

And just like that, Cognis was born!
