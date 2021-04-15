# MouseHunt Community Tools Privacy Policy

## What we collect

By using this extension we will collect various information based on your activities in the MouseHunt game when you play it at https://www.mousehuntgame.com only. The information collected varies by activity but includes:

* Your hunter ID which is then stored using a one-way hash. This does not mean it is secure, only that it is non-trivial to identify an individual from database entries.
* Your hunt information including setup used (weapon, base, charm, cheese, etc), mouse attracted (if any), loot drops, and relevant environmental information
* Convertibles opened - how many and what kind with what they resulted in
* The timestamps of these activities
* Which mice are on your map
* Crown counts from the appropriate profile pages (this is optional)

Quite specifically and on purpose we do not collect hunter names, IP Addresses (our web server does log these separately but they are only available through system access), or other account information.

## What we do with it

We aggregate the collected data to provide summary information like mouse attraction rates, loot drop rates, prevalence of mice on map types, and conversion rates for things that can be opened. We provide an endpoint for a hunter to look at their hunt history as recorded in the database. We provide a docker image and backup files of the database that **others may freely download and use**. We occasionally update the documented schema: https://github.com/mh-community-tools/mh-hunt-helper/blob/master/DB/diagram.png but it can be observed in your own copy of the database.

## Third-Party Items

We include two third-party features:

* tsitu's auto-loader. This is a set of handy buttons that link to [Tsitu's tools](https://tsitu.github.io/MH-Tools/index.html) for things like the catch rate estimator and map solver. This requires user activity to send information and is identical to using the bookmarklets provided there.
* [The MouseHunt Crown Collector Scoreboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQG5g3vp-q7LRYug-yZR3tSwQzAdN7qaYFzhlZYeA32vLtq1mJcq7qhH80planwei99JtLRFAhJuTZn/pubhtml) is populated from data gathered when you visit a hunter's profile. We do not store this information. 
