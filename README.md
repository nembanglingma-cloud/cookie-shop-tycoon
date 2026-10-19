# Kevin's Cookie Shop Tycoon

Double-click **index.html** to play in any modern browser. No installation or build step is needed. The optional web fonts use the internet; the game itself works offline.

Start with $100 and run your shop for 30 days. Choose your batch size, cookie price, and advertising spend, then open the shop to see that day's results.

- Pick one cookie variety for each day’s signature batch: chocolate chip ($0.50 ingredients, $2.00 suggested price), oatmeal cinnamon ($0.65, $2.50), or double chocolate ($0.90, $3.25). Selecting a variety fills its suggested selling price; you can adjust it freely.
- Each variety’s suggested price is its demand baseline, so premium recipes can command higher prices. Ingredients, advertising, and $5 daily overhead must fit your cash before opening.
- Results and the ledger name the variety sold. Saved runs restore your last variety and selling price; older saves remain compatible and their past batches count as chocolate chip.
- Lower prices attract more customers. Advertising increases demand with diminishing returns. Daily forecasts and a small random variation influence foot traffic.
- Unsold cookies are donated, so inventory doesn't carry over.
- The run ends after day 30 or when cash falls below the $5 needed to open.
- Progress saves automatically in your browser when local storage is available. Start fresh resets the run.
- Each day includes a short animated customer rush. Small days show one visitor per cookie; busy days group orders into up to 18 visitors. Purchase bubbles show each order's size. Choose **See results** to skip ahead. Reduced-motion preferences are respected.

For an optional local server, run `python -m http.server 8000` in this folder and open http://localhost:8000.

To run the automated game checks with Node.js, use `node test-game.cjs`.
