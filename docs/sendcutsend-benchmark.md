# SendCutSend customer-experience benchmark

Checked 2026-10-19 using the cited public pages, page text, and a read-only REA browser capture. The account and checkout surfaces were not entered.

## Direct observations

- The homepage makes a direct manufacturing offer, gives a prominent start action, and routes customers to materials and named services. It explicitly supports a no-CAD start through a Parts Builder link. [Main website](https://sendcutsend.com/)
- The getting-started guide begins with CAD upload and published file/setup guidance, but also has a separate “No CAD file?” section linking to the Parts Builder. It lists additional finishing services and points to service-specific constraints. [Getting started](https://sendcutsend.com/guidelines/getting-started/)
- The custom-quote FAQ distinguishes instant pricing for supported files/part sizes from a custom quote that receives team review. It asks for a design file and request details; its public FAQ lists accepted file formats. [Custom quotes](https://sendcutsend.com/faq/how-to-get-a-custom-quote/)
- The sheet-cutting page describes choosing a process based on material and geometry, publishes service/material options and design guidelines, and presents an upload-to-material-to-finishing-to-order sequence. Its pricing examples are explicitly described as general estimates. [Sheet cutting](https://sendcutsend.com/services/sheet-cutting/)
- The supplied ordering-parts URL resolved to the Getting Started guide during the REA capture, rather than a distinct ordering page. Public pages link to a separate authenticated customer application for pricing/cart actions; this benchmark did not inspect that account workflow. [Ordering parts](https://sendcutsend.com/faq/how-do-i-order-parts-on-your-website/)
- The REA browser capture opened public pages only, with no account storage, private data, or order submission. The capture supports visible page-flow observations, not claims about an authenticated checkout transaction.

## Qutlas design decisions

- Use one strong homepage proposition and send every material card to the same project flow with its material preselected.
- Keep “drawing,” “description,” and “idea” as valid starting modes; a CAD file is optional.
- Use progressive steps: material and need, project description/files, material-specific details, customer/location, then review.
- Ask material-specific questions: steel form/grade and fabrication; wood type/board and cut/edge work; tile application/style and area or box quantity; granite application, finish, dimensions, cut-outs, and installation interest.
- Use metric dimensions and selectable quantity units. Route unknown or unsupported specifications to quote review rather than guessing a price or process.
- Do not copy SendCutSend brand, copy, page design, pricing, service claims, production times, or account functionality. Qutlas currently has no live price engine, upload storage, order tracking, or verified workshop-capacity feed.

## Image sources and credits

- Steel: [Mechanical workshop](https://commons.wikimedia.org/wiki/File:Mechanical_workshop.jpg), Cjp24, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Wood: [Stack of wooden planks - close-up 01](https://commons.wikimedia.org/wiki/File:Stack_of_wooden_planks_-_close-up_01.jpg), David r jenkins, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Tiles: [Ceramic tile 6858](https://commons.wikimedia.org/wiki/File:Ceramic_tile_6858.jpg), Chris Light, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Granite: [Granite slabs on a truck awaiting to be installed in a kitchen](https://commons.wikimedia.org/wiki/File:Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg), Tomwsulcer, CC0.