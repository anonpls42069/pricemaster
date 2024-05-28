class PriceMaster {

	userName;

	constructor(userName) {
		this.userName = userName;
		this.init();
	}

	init() {
		this.createMessagingInterface();
		this.addListeners();
	} 

	createMessagingInterface() {
		let mainContainer = document.querySelector('#container');
	
		// Create the toggle button
		let toggleButton = document.createElement('button');
		toggleButton.id = 'toggleChat';
		toggleButton.classList.add('button-74');
		toggleButton.textContent = 'Toggle Chat';
		toggleButton.title = 'Estimates available for: Business Card, Banner, Booklet, Bookmark, Brochure, Decal, Door Hanger, Envelope, Flyer, Greeting Card, Letter, Letterhead, Magazine, Menu, Notecard, Notepad, Postcard, Poster, Rack Card, Sign, Table Tent, Wide Format';
	
		// Create the chat container and build its inner HTML
		let chatContainer = document.createElement('div');
		chatContainer.classList.add('hidden');
		chatContainer.id = 'chatContainer';
		chatContainer.innerHTML = `
			<div id="chatResponseContainer">
				<div id="chatResponse" contentEditable="true" style="userSelect: none;"></div>
			</div>
			<div id="chatWindowContainer">
				<div id="chatControls">
					<button id="aiReviewButton" data-ai="true">AI Review Pricing On</button>
					<button id="priceMasterButton" data-pm="false">Business Mode On</button>
				</div>
				<div id="chatWindow" contentEditable="true" style="userSelect: none;"></div>
				<div id="updateContainer">
					<div id="updateMessage"></div>
					<div id="updateProgressHolder">
						<div id="updateProgress"></div>
					</div>
				</div>
				<input id="chatInput" type="text" placeholder="Enter your quote request here">
				<input id="fileUpload" type="file" accept="image/*" placeholder="Upload an image to quote">
				<button id="requestQuote" class="button-74">Send</button>
			</div>
		`;
	
		// Prepend the chatContainer and toggleButton to the mainContainer
		mainContainer.prepend(chatContainer);
		mainContainer.prepend(toggleButton);
	}
	

	addListeners() {
		// now make the request button trigger the ask openai method
		let sendButton = document.querySelector('#requestQuote');
		sendButton.addEventListener('click', (e) => {
			this.callOpenAI(this.userName)
		});

		let chatInput = document.querySelector('#chatInput');
		chatInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				this.callOpenAI(this.userName);
			}
		});

		let toggleButton = document.querySelector('#toggleChat');
		toggleButton.addEventListener('click', this.toggleChat);
		
		let aiReviewButton = document.querySelector('#aiReviewButton');
		aiReviewButton.addEventListener('click', this.toggleAIReview);

		let priceMasterButton = document.querySelector('#priceMasterButton');
		priceMasterButton.addEventListener('click', this.togglePriceMaster);
	}

	toggleAIReview() {
		let aiReviewButton = document.querySelector('#aiReviewButton');
		let ai = aiReviewButton.dataset.ai;
		if (ai === 'true') {
			aiReviewButton.textContent = 'AI Review Pricing Off';
			aiReviewButton.dataset.ai = 'false';
		} else {
			aiReviewButton.textContent = 'AI Review Pricing On';
			aiReviewButton.dataset.ai = 'true';
		}
	}

	togglePriceMaster() {
		let priceMasterButton = document.querySelector('#priceMasterButton');
		let pm = priceMasterButton.dataset.pm;
		if (pm === 'true') {
			priceMasterButton.textContent = 'Business Mode On';
			priceMasterButton.dataset.pm = 'false';
		} else if (pm === 'false') {
			priceMasterButton.textContent = 'Fun Mode On';
			priceMasterButton.dataset.pm = 'jokes';
		} else {
			priceMasterButton.textContent = 'Price Master On';
			priceMasterButton.dataset.pm = 'true';
		}
	}

	toggleChat() {
		let chatContainer = document.querySelector('#chatContainer');
		chatContainer.classList.toggle('hidden');
	}

	async callOpenAI(userName) {

		unlockAllFields();

		let updateMessage = document.querySelector('#updateMessage');
		let updateContainer = document.querySelector('#updateContainer');

		let chatInput = document.querySelector('#chatInput');
		let userRequest = chatInput.value;
		chatInput.value = '';
		let requestQuote = document.querySelector('#requestQuote');
		requestQuote.style.display = 'none';

		// check that it isn't empty
		if (userRequest === '') {
			updateContainer.style.display = 'none';
			alert('Please enter a request before sending');
			return;
		}

		addMessage(userRequest, true);
		let threeDots = '<div class="delete-message"><span class="dot dot1"></span><span class="dot dot2"></span><span class="dot dot3"></span></div>';
		addMessage(threeDots, false, true);
		
		/**
		 * Need to add
		 * 1. difference between digital and wf lam
		 * 2. 
		 */
		let intro = '';
		if (userName !== '') {
			intro = "The user requesting the quote/information is named "+ userName + ". Address them by name in your first message and again when appropriate.";
		}
		
		let generateOpenAIRequest = `You are an expert print manufacturing estimator. ${intro} You take the users request and populate a JSON string with the most accurate information that will compute accurately to provide the correct pricing for the user. Do your best to deliever a quote everytime with what information you are given, DO NOT ASK FOR MORE INFORMATION, just deliver your best guess.
			ONLY respond with the following JSON structure or else it will break. Do not include quotes in the json that isn't part of the json structure. If being asked to update or fix a quote, make sure to clear out any fields that may have been populated last time that need to be cleared, ie if pads were quoted then business cards, make sure to return an empty string for #padding.
			The JSON structure is as follows (order is critical):
			[
				{
					"message": "string" [the message to the user"],
				},
				{
					"#productType": "string" -required [can only be "Printed", "Service", or "Inventory"],
					"#category": "string" -required [see category list below],
					"#productID": "string" -required [just return "custom"],
					"#device": "string" -required [can only be "28" (which is for: Ricoh C9210 (small format digital)), "17" (which is for: Envelope Press), "21" (which is for wide format low resolution cheap), "20" (which is for wide format mid resolution less cheap)],
					"#productDesc": "string" -required [this is a description of the product, if productID is custom, this should be the description of the product, very succinctly],
					"#paperType": "string" -required [this should always be "None"],
					"#inksF": "string" -required [inks front side, can only be "0", "1", or "4"],
					"#inksB": "string" -required [inks back side, can only be "0", "1", or "4"],
					"#isFolded": "boolean" [this is true if the product is a folded booklet where the spread are multiplied, so a 12 sheet booklet makes 48 pages, this allows that, else leave it off],
					"#numPages": "integer" -required [this is the number of sheets in the job, so 2 sided postcard is 1, 40 page saddle stitched booklet is 10],
					"#sheets": "integer" -required [this is the number of pages in the job, so 2 sided postcard is 2, 40 page saddle stitched booklet is 40],
					"#padding": "integer" [this is the number of sheets to pad the job by only for padding jobs, like notepads, else leave it off],
					"#versions": "integer" [this is the number of versions of the job so if they need 50 sets of 20 cards then this is 20, if not defined, dont include this],
					"#paperID": "string" -required [see paper list below, only return the id]
					"#art_size": "string" -required [ONLY include this if productID is custom - this is a string of the "width x height" of the art size WITH bleed which is usually .125 each direction, so a 3.5x2 business card would be 3.625x2.125, and an 8.5x11 tri-fold would be 8.625x11.125 and an 8.5x11 finished size booklet would be 17.125x11.125 because it folds finished to 8.5x11],
					"#cut_size": "string" -required [ONLY include this if productID is custom - this is a string of the "width x height" of the cut size of the product, so an 8.5x11 tri-fold would be 8.5x11 and an 8.5x11 finished size booklet would be 17x11 because it folds finished to 8.5x11],
					"#finish_size": "string" -required [ONLY include this if productID is custom - this is a string of the "width x height" of the finished size of the product, so an 8.5x11 tri-fold would be 8.5x3.667 and an 8.5x11 finished size booklet would be 8.5x11 because it folds finished to 8.5x11],
					"#quantity0": "integer" -required [this is the first quantity of the quote, if not defined, pick a good spread],
					"#quantity1": "integer" [this is the second quantity of the quote, if not defined, pick a good spread],
					"#quantity2": "integer" [this is the third quantity of the quote, if not defined, pick a good spread],
					"#BindingB2": "boolean" [only return this if the product needs "Machine Saddle Stitching"],
					"#B3corner-staple": "boolean" [only return this if the product needs "Corner Staple"],
					"#BindingB4": "boolean" [only return this if the product needs "Coil Binding"],
					"#BindingB6": "boolean" [only return this if the product needs "Black Back Covers for Coil Binding"],
					"#BindingB5": "boolean" [only return this if the product needs "Clear Front Covers for Coil Binding"],
					"#G2GlossLam": "boolean" [only return this if the product needs "2 sided Gloss Lamination" this is the only 2 sided gloss lamination task for small format work, not wide format],
					"#G2MatteLam": "boolean" [only return this if the product needs "2 sided Matte Lamination" this is the only 2 sided matte lamination task for small format work, not wide format],
					"#G1GlossLam": "boolean" [only return this if the product needs "1 sided Gloss Lamination" this is the only 1 sided gloss lamination task for small format work, not wide format],
					"#G1MatteLam": "boolean" [only return this if the product needs "1 sided Matte Lamination" this is the only 1 sided matte lamination task for small format work, not wide format],
					"#G2GlossUV": "boolean" [only return this if the product needs "2 sided Gloss UV Coating" this is the only 2 sided gloss UV coating task for small format work, and gloss stocks are the only ones that can take UV],
					"#G1GlossUV": "boolean" [only return this if the product needs "1 sided Gloss UV Coating" this is the only 1 sided gloss UV coating task for small format work, and gloss stocks are the only ones that can take UV],
					"#Corner_RoundingCR3": "boolean" [only return this if the product needs "1/2 in. Corner Rounding", this is for small format work digital print, not wide format],
					"#Corner_RoundingCR2": "boolean" [only return this if the product needs "1/4 in. Corner Rounding", this is for small format work digital print, not wide format],
					"#Corner_RoundingCR1": "boolean" [only return this if the product needs "1/8 in. Corner Rounding", this is for small format work digital print, not wide format],
					"#DC2Med_Speed_DC": "boolean" [only return this if the product needs "Wideformat Medium Speed on the die cutter for digital print", not wide format],
					"#DC3Complex_Cuts": "boolean" [only return this if the product needs "Wideformat Slow Speed for Complex Cuts on the die cutter for digital print", not wide format],
					"#D1Half": "boolean" [only return this if the product needs a "1 - 1/2 in. hole drilled],
					"#D1Quarter": "boolean" [only return this if the product needs a "1 - 1/4 in. hole drilled],
					"#D1Eighth": "boolean" [only return this if the product needs a "1 -1/8 in. hole drilled],
					"#D2Half": "boolean" [only return this if the product needs a "2 - 1/2 in. holes drilled],
					"#D2Quarter": "boolean" [only return this if the product needs a "2 - 1/4 in. holes drilled],
					"#D2Eighth": "boolean" [only return this if the product needs a "2 -1/8 in. holes drilled],
					"#D3Half": "boolean" [only return this if the product needs a "3 - 1/2 in. holes drilled],
					"#D3Quarter": "boolean" [only return this if the product needs a "3 - 1/4 in. holes drilled],
					"#D3Eighth": "boolean" [only return this if the product needs a "3 -1/8 in. holes drilled],
					"#PaddingP25": "boolean" [only return this if the product needs "pad in 25's"],
					"#PaddingP50": "boolean" [only return this if the product needs "pad in 50's"],
					"#PaddingP100": "boolean" [only return this if the product needs "pad in 100's"],
					"#PerforateP1": "boolean" [only return this if the product needs "1 perforation on sheet"],
					"#PerforateP2": "boolean" [only return this if the product needs "2 perforations on sheet"],
					"#Text_ScoringS1": "boolean" [only return this if the product needs "1 score on text weight"],
					"#Text_ScoringS2": "boolean" [only return this if the product needs "2 scores on text weight"],
					"#Text_ScoringS3": "boolean" [only return this if the product needs "3 scores on text weight"],
					"#Text_ScoringS4": "boolean" [only return this if the product needs "4 scores on text weight"],
					"#Cover_ScoringS1": "boolean" [only return this if the product needs "1 score on cover weight"],
					"#Cover_ScoringS2": "boolean" [only return this if the product needs "2 scores on cover weight"],
					"#Cover_ScoringS3": "boolean" [only return this if the product needs "3 scores on cover weight"],
					"#Cover_ScoringS4": "boolean" [only return this if the product needs "4 scores on cover weight"],
					"#Text_FoldingTF": "boolean" [only return this if the product needs "Text weight Tri-Folding"],
					"#Text_FoldingZF": "boolean" [only return this if the product needs "Text weight Z-Folding"],
					"#Text_FoldingSF": "boolean" [only return this if the product needs "Text weight Half-Folding"],
					"#Text_FoldingPP": "boolean" [only return this if the product needs "Text weight Double-Parallel-Folding"],
					"#Text_FoldingQF": "boolean" [only return this if the product needs "Text weight Quarter-Folding"],
					"#Cover_FoldingSF": "boolean" [only return this if the product needs "Cover weight Half-Folding"],
					"#Cover_FoldingPP": "boolean" [only return this if the product needs "Cover weight Double-Parallel-Folding"],
					"#Cover_FoldingZF": "boolean" [only return this if the product needs "Cover weight Z-Folding"],
					"#CoverFoldingTF1": "boolean" [only return this if the product needs "Cover weight Tri-Folding"],
					"#Cover_FoldingQF": "boolean" [only return this if the product needs "Cover weight Quarter-Folding"],
					"#WF4grommets": "boolean" [only return this if the product needs "Grommets for wide format rigid sign (real estate signs usually need them)"],
					"#WF4round-corner": "boolean" [only return this if the product needs "Round Corners for wide format rigid sign (real estate signs usually need them)"],
					"#WF1GloOve": "boolean" [only return this if the product needs "gloss laminate for wide format" this is the only gloss lamination task for wide format work],
					"#WF1MatOve": "boolean" [only return this if the product needs "matte laminate for wide format" this is the only matte lamination task for wide format work],
					"#WF2banner_grommets": "boolean" [only return this if the product needs "grommets for wide format banner"],
					"#WF2banner_hemming": "boolean" [only return this if the product needs "hemming for wide format banner"],
					"#WF2banner_wind_slits": "boolean" [only return this if the product needs "wind slits for wide format banner"],
					"#CutPerHour-30WFC1": "boolean" [only return this if the product needs "Router cutting 30 pieces per hour for wide format" this is for plotting stickers or vinyl decals],
					"#CutPerHour-60WFC2": "boolean" [only return this if the product needs "Router cutting 60 pieces per hour for wide format" this is for plotting stickers or vinyl decals],
					"#CutPerHour-100WFC3": "boolean" [only return this if the product needs "Router cutting 100 pieces per hour for wide format" this is for plotting stickers or vinyl decals],
					"#CutPerHour-200WFC4": "boolean" [only return this if the product needs "Router cutting 200 pieces per hour for wide format" this is for plotting stickers or vinyl decals],
					"#CutPerHour-350WFC5": "boolean" [only return this if the product needs "Router cutting 350 pieces per hour for wide format" this is for plotting stickers or vinyl decals],
					"#CutPerHour-500WFC6": "boolean" [only return this if the product needs "Router cutting 500 pieces per hour for wide format" this is for plotting stickers or vinyl decals],
					"#Hand_FoldingH1": "boolean" [only return this if the product needs "Hand Folding 1 fold" usually for small, thick cards that need folding, like business card size],
					"#Hand_FoldingH2": "boolean" [only return this if the product needs "Hand Folding 2 folds" usually for small, thick cards that need folding, like business card size],
					"#Mail_PrepM1": "boolean" [only return this if the product is a mailing and requires the extra work of mail prep],
					"#AddressingI2": "boolean" [only return if this job requires variable data on press, like addressing or numbering],
					"#AddressingI1": "boolean" [only return if this job requires variable data on an inkjet because the quantity is over 15000 and is for envelopes that get outsourced, like addressing or numbering],
					"#productionNote": "string" [this is a note to the production team, like "this job is a rush, please expedite", or "5th fold is a hand fold because it is too many folds for the folder"],
					"#estimatingNote": "string" [this is a note about the estimate beting made, for future reference, like "this is a guess because the customer was not clear on the quantity"],
				},
				{
					"html_unordered_list_of_specs": "string" [this is the html for an unordered list of all the specs of the job, like size, paper, inks, device, finishing etc. make sure to include any necessary inline styling for emphasis or alerts, and youre in control of all the styling for this div and information, so make it nice always.],
				}
			]

			category list:
			"BC" (for business card)
			"Banner"
			"Booklet"
			"Bookmark"
			"Brochure"
			"Decal"
			"Door Hanger"
			"Envelope"
			"Flyer"
			"Greeting Card"
			"Letter"
			"Letterhead"
			"Magazine"
			"Menu"
			"Notecard"
			"Notepad"
			"Postcard"
			"Poster"
			"Rack Card"
			"Sign"
			"Table Tent"
			"Wide Format"

			paper list (only return the id):
			Coated Text:
			"S311" (Pacesetter Digital Text Gloss 70# 11x17 White)
			"S310" (Pacesetter Digital Text Gloss 70# 12x18 White)
			"S309" (Pacesetter Digital Text Gloss 70# 13x19 White)
			"S335" (Pacesetter Digital Text Silk 70# 11x17 White)
			"S345" (Pacesetter Digital Text Silk 70# 12x18 White)
			"S340" (Pacesetter Digital Text Silk 70# 13x19 White)
			"S103" (Blazer Digital Text Gloss 80# 11x17 White)
			"S307" (Pacesetter Digital Text Gloss 80# 12x18 White)
			"S104" (Blazer Digital Text Gloss 80# 13x19 White)
			"S106" (Blazer Digital Text Satin 80# 12x18 White)
			"S107" (Blazer Digital Text Satin 80# 13x19 White)
			"S109" (Blazer Digital Text Satin 100# 11x17 White)
			"S108" (Blazer Digital Text Satin 100# 12x18 White)
			"S564" (Blazer Digital Text Satin 100# 13x19 White)
			"S304" (Pacesetter Digital Text Gloss 100# 11x17 White)
			"S303" (Pacesetter Digital Text Gloss 100# 12x18 White)
			"S302" (Pacesetter Digital Text Gloss 100# 13x19 White)

			Uncoated Text:
			"S1158" (Accent Opaque Text Digital & Cut Sizes 60# 11x17 White "60# uncoated" [default for 2 up letters that do not bleed like letters for mailings])
			"S1200" (Accent Opaque Text Digital & Cut Sizes 60# 12x18 White "60# uncoated" [default for most jobs that take 60# text])
			"S1160" (Accent Opaque Text Digital & Cut Sizes 70# 11x17 White "70# uncoated" [default for 2 up letter head that do not bleed])
			"S1161" (Accent Opaque Text Digital & Cut Sizes 70# 12x18 White "70# uncoated" [default for most jobs that take 70# text])
			"S1165" (Accent Opaque Cover Digital & Cut Sizes 80# 18x12 White)
			"S1300" (Accent Opaque SS Cover Digital & Cut Sizes 80# 19x13 White)
			"S1299" (Accent Opaque Text Digital & Cut Sizes 100# 12x18 White)

			Coated Cover:
			"S112" (Blazer Digital Cover Gloss 80# 19x13 White)
			"S120" (Blazer Digital Cover Satin 80# 19x13 White)
			"S114" (Blazer Digital Cover Gloss 100# 19x13 White [default for postcards])
			"S607" (Blazer Digital Cover Satin 100# 19x13 White)
			"S118" (Blazer Digital Cover Gloss 130# 19x13 White [default for business cards])
			"S123" (Blazer Digital Cover Satin 130# 19x13 White [default for business cards])
			"S759" (Tango Cover C1S Digital 10pt 18x12 White)
			"S769" (Tango Cover C2S Digital 10pt 18x12 White)
			"S760" (Tango Cover C1S Digital 10pt 19x13 White)
			"S762" (Tango Cover C1S Digital 12pt 18x12 White)
			"S771" (Tango Cover C2S Digital 12pt 18x12 White)
			"S763" (Tango Cover C1S Digital 12pt 19x13 White)
			"S764" (Tango Cover C1S Digital 14pt 18x12 White)
			"S765" (Tango Cover C1S Digital 14pt 19x13 White)
			"S766" (Tango Cover C1S Digital 16pt 18x12 White)
			"S767" (Tango Cover C1S Digital 16pt 19x13 White)

			Uncoated Cover:
			"S1165" (Accent Opaque Cover Digital & Cut Sizes 80# 18x12 White)
			"S1257" (Everyday Digital Cover Uncoated 100# 18x12 White)
			"S1298" (Accent Opaque Cover Digital & Cut Sizes 120# 18x12 White)
			"S1260" (Everyday Digital Smooth Cover Uncoated 120# 19x13 White)

			Premium Coated Cover:
			"S441" (McCoy Cover Gloss Digital 80# 19x13 White)
			"S442" (McCoy Cover Gloss Digital 100# 19x13 White)
			"S449" (McCoy Cover Silk Digital 120# 18x12 White)
			"S450" (McCoy Cover Silk Digital 120# 19x13 White)
			"S447" (McCoy Cover Gloss Digital 120# 19x13 White)

			Wide Format:
			"R111" (54" 13oz frontlit banner [default for banners])
			"R113" (63" 13oz frontlit banner [for larger banners])
			"R132" (Orajet 3641 Matte White Vinyl 54" [default for decals])
			"R140" (Orajet 3641 Gloss White Vinyl 54" [default for decals])
			"B116" (4mm Coroplast 50x100 [default for yard signs])
			"B110" (4mm Coroplast 60x120 [default for yard signs])
			"B101" (.125" 48x96 white foam core)
			"B102" (.187" 48x96 white foam core)
			"B107" (ACM 48x96 White 3mm [default for real estate signs])
			"B108" (ACM 48x96 Silver 3mm)
			"B144" (ACM 48x96 Brushed Aluminum 3mm)
			"B127" (ACM 48x96 Brushed Aluminum 6mm)
			"B141" (1/8" Clear Acrylic)
			"B140" (1/4" Clear Acrylic)
			"B139" (1/2" Clear Acrylic)
			"B138" (1/8" Black Acrylic)
			"B136" (1/4" Black Acrylic)
			"B130" (1/2" Black Acrylic)
			"B131" (1" Black Acrylic)
			"B132" (1" White Acrylic)

			Envelopes:
			"E169" (Pacesetter Envelopes Commercial 24# #10 White)
			"E146" (Cougar Envelopes Commercial 70# #10 White [more expensive by 40%])
			"E181" (Pacesetter Envelopes Commercial 24# #10 White Window)
			"E170" (Pacesetter Envelopes Commercial 24# #9 White)
			"E183" (Pacesetter Envelopes Commercial 24# #9 White Window)
			"E241" (Via Announcement Envelopes 70# A7 Pure White)
			"E336" (Via Announcement Envelopes 70# A7 Bright White)
			"E249" (Via Announcement Envelopes 70# A6 Pure White)
			"E102" (Via Announcement Envelopes 70# A6 Bright White)
			"E240" (Via Announcement Envelopes 70# A2 Pure White)
			"E101" (Via Linen Announcement Envelopes 70# A2 Bright White)


			Examples:

			Example 1:
			Prompt: "48 page booklet on thin stock gloss, 2000 of them 5.5x8.5"

			JSON Response:
			[
				{
					"message": "Hey Autumn, here is your quote for a 48 page booklet on thin stock gloss."
				},
				{
					"#productType": "Printed",
					"#category": "Booklet",
					"#productID": "custom",
					"#device": "28",
					"#productDesc": "48 page Booklet",
					"#paperType": "None",
					"#inksF": "4",
					"#inksB": "4",
					"#numPages": "12",
					"#isFolded": true,
					"#sheets": "48",
					"#paperID": "S1158",
					"#art_size": "11.125x8.625",
					"#cut_size": "11x8.5",
					"#finish_size": "5.5x8.5",
					"#quantity0": "2000",
					"#quantity1": "2500",
					"#quantity2": "3000",
					"#BindingB2": true
				},
				{
					"html_unordered_list_of_specs": "<h2 style="font-weight:bold; font-size: 20px; font-style: italic;">Details of your Booklet quote:</h2><ul style="list-style-type: none; padding: 0; margin: 0;"><li style="background-color: #f3f4f6; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><span style="font-weight: 600; color: #111827;">Product Type:</span> Printed</li><li style="background-color: #f3f4f6; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><span style="font-weight: 600; color: #111827;">Category:</span> Booklet</li><li style="background-color: #f3f4f6; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><span style="font-weight: 600; color: #111827;">Device:</span> Ricoh C9210 (small format digital)</li><li style="background-color: #f3f4f6; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><span style="font-weight: 600; color: #111827;">Finishing:</span> Machine Saddle Stitching</li><li style="background-color: #f3f4f6; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><span style="font-weight: 600; color: #111827;">Quantity:</span> 2000</li></ul>"
				}
			]

			Example 2:
			Prompt: "4x2.5 booklet on 60# text"

			JSON Response:
			[
				{
					"message": "How many pages for the booklets and what quantities?"
				},
				{},
				{
					"html_unordered_list_of_specs": "<h3 style="color:red; text-style:underlined;">Please provide the number of pages and quantities for the booklets.</h3>"
				}
			]

			Prompt: "48 pages, 2500"

			JSON Response:
			[
				{
					"message": "Here is your quote for a 4x2.5 booklet on 60# text."
				}, {
					"#productType": "Printed",
					"#category": "Booklet",
					"#productID": "custom",
					"#device": "28",
					"#productDesc": "4x2.5 Booklet on 60# Text",
					"#paperType": "None",
					"#inksF": "4",
					"#inksB": "4",
					"#numPages": "12",
					"#sheets": "48",
					"#paperID": "S1200",
					"#art_size": "4.125x2.625",
					"#cut_size": "4x2.5",
					"#finish_size": "4x2.5",
					"#quantity0": "2500",
					"#quantity1": "3000",
					"#quantity2": "3500",
					"#BindingB2": true,
					"#isFolded": true,
				}, {
					"html_unordered_list_of_specs": "<ul style="list-style: none; padding: 0; margin: 0; font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;"></li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #28a745; font-size: 11px;"><strong>Category:</strong> Booklet</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #ffc107; font-size: 11px;"><strong>Quantity:</strong> 2500</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #17a2b8; font-size: 11px;"><strong>Paper:</strong> Accent Opaque Text Digital & Cut Sizes 60# 11x17 White</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #fd7e14; font-size: 11px;"><strong>Inks:</strong> Full Color Both Sides</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #6f42c1; font-size: 11px;"><strong>Device:</strong> Ricoh C9210 (small format digital)</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #d63384; font-size: 11px;"><strong>Size:</strong> Art Size: 4.125x2.625, Cut Size: 4x2.5, Finished Size: 4x2.5 </li></ul>"
				}
			]

			Example 3:

			Prompt: "banner 4x8"

			JSON Response:
			[
				{
					"message": "Here's your quote for a standard 4x8 banner."
				},
				{
					"#productType": "Printed",
					"#category": "Banner",
					"#productID": "custom",
					"#device": "21",
					"#productDesc": "Standard 4x8 Banner",
					"#paperType": "None",
					"#inksF": "4",
					"#inksB": "0",
					"#numPages": "1",
					"#sheets": "1",
					"#paperID": "R111",
					"#art_size": "96.125x48.125",
					"#cut_size": "96x48",
					"#finish_size": "96x48",
					"#quantity0": "1",
					"#quantity1": "5",
					"#quantity2": "10",
					"#WF2banner_grommets": true,
					"#WF2banner_hemming": true
				},
				{
					"html_unordered_list_of_specs": "<ul style="list-style: none; padding: 0; margin: 0; font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;"><li style="background-color: #fff; padding: 4px; border-left: 4px solid #007bff; font-size: 11px;"><strong>Product Type:</strong> Printed</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #28a745; font-size: 11px;"><strong>Category:</strong> Banner</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #ffc107; font-size: 11px;"><strong>Quantity:</strong> Ranges 1, 5, 10</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #17a2b8; font-size: 11px;"><strong>Material:</strong> 54" 13oz frontlit banner</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #fd7e14; font-size: 11px;"><strong>Inks:</strong> Full Color One Side</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #6f42c1; font-size: 11px;"><strong>Device:</strong> Wide format low resolution cheap</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #d63384; font-size: 11px;"><strong>Finishing:</strong> Grommets, Hemming</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #20c997; font-size: 11px;"><strong>Size:</strong> Art Size: 24.125x60.125 inches, Cut Size: 24x60 inches, Finished Size: 24x60 inches</li></ul>"
				}
			]

			Example 4:

			Prompt: "3214 mailng no bleed variable folds to letter"

			JSON Response:
			[
				{
					"message": "Here's your quote for a mailing project with variable folds to letter size, no bleed."
				},
				{
					"#productType": "Printed",
					"#category": "Letter",
					"#productID": "custom",
					"#device": "28",
					"#productDesc": "Mailing - No Bleed, Variable Folds to Letter",
					"#paperType": "None",
					"#inksF": "1",
					"#inksB": "0",
					"#numPages": "1",
					"#sheets": "1",
					"#paperID": "S1158",
					"#art_size": "8.5x11",
					"#cut_size": "8.5x11",
					"#finish_size": "8.5x3.667",
					"#quantity0": "3214",
					"#quantity1": "3500",
					"#quantity2": "4000",
					"#Text_FoldingSF": true,
					"#Mail_PrepM1": true,
					"#AddressingI2": true
				},
				{
					"html_unordered_list_of_specs": "<ul style=\"list-style: none; padding: 0; margin: 0; font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;\"><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #007bff; font-size: 11px;\"><strong>Product Type:</strong> Service</li><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #28a745; font-size: 11px;\"><strong>Category:</strong> Letter</li><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #ffc107; font-size: 11px;\"><strong>Quantity:</strong> 3214</li><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #17a2b8; font-size: 11px;\"><strong>Material:</strong> Accent Opaque Text Digital & Cut Sizes 60# 11x17 White</li><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #fd7e14; font-size: 11px;\"><strong>Inks:</strong> Black One Side</li><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #6f42c1; font-size: 11px;\"><strong>Device:</strong> Ricoh C9210 (small format digital)</li><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #d63384; font-size: 11px;\"><strong>Finishing:</strong> Half-Folding, Mail Prep, Variable Data Addressing</li></ul>"
				}
			]

			Example 5 
			Prompt: "Can you tell me the possible stocks I would print folded brochures on"

			JSON Response:
			[
				{
					"message": "Here are a few possible stocks you can print brochures on."
				},
				{},
				{
					"html_unordered_list_of_specs": "<ul style="list-style: none; padding: 0; margin: 0; font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;"><li style="background-color: #fff; padding: 4px; border-left: 4px solid #007bff; font-size: 11px;"><strong>Coated Text Options:</strong><ul><li>Pacesetter Digital Text Silk 70# 12x18 White (S345)</li><li>Blazer Digital Text Gloss 80# 12x18 White (S106)</li><li>Blazer Digital Text Satin 80# 12x18 White (S107)</li><li>Blazer Digital Text Satin 100# 12x18 White (S108)</li></ul></li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #28a745; font-size: 11px;"><strong>Uncoated Text Options:</strong><ul><li>Accent Opaque Text Digital &amp; Cut Sizes 60# 12x18 White "60# uncoated" (S1200) - default for most jobs</li><li>Accent Opaque Text Digital &amp; Cut Sizes 70# 12x18 White "70# uncoated" (S1161)</li></ul></li></ul>"
				}
			]

			Example 6
			Prompt: "725 letters no bleed folded on 60#"

			JSON Response:
			[
				{
					"message": "Hey Thad, here's your quote for 725 letters, no bleed, folded on 60# stock."
				},
				{
					"#productType": "Printed",
					"#category": "Letter",
					"#productID": "custom",
					"#device": "28",
					"#productDesc": "60# Uncoated Text Letter, Folded, No Bleed",
					"#paperType": "None",
					"#inksF": "1",
					"#inksB": "0",
					"#numPages": "1",
					"#sheets": "1",
					"#paperID": "S1158",
					"#art_size": "8.5x11",
					"#cut_size": "8.5x11",
					"#finish_size": "8.5x3.667",
					"#quantity0": "725",
					"#quantity1": "1000",
					"#quantity2": "1500",
					"#Text_FoldingTF": true
				},
				{
					"html_unordered_list_of_specs": "<ul style="list-style: none; padding: 0; margin: 0; font-family: Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;"><li style="background-color: #fff; padding: 4px; border-left: 4px solid #007bff; font-size: 11px;"><strong>Product Type:</strong> Printed</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #28a745; font-size: 11px;"><strong>Category:</strong> Letter</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #ffc107; font-size: 11px;"><strong>Quantity:</strong> 725, 1000, 1500</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #17a2b8; font-size: 11px;"><strong>Material:</strong> Accent Opaque Text Digital &amp; Cut Sizes 60# 11x17 White</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #fd7e14; font-size: 11px;"><strong>Inks:</strong> Black One Side</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #6f42c1; font-size: 11px;"><strong>Device:</strong> Ricoh C9210 (small format digital)</li><li style="background-color: #fff; padding: 4px; border-left: 4px solid #d63384; font-size: 11px;"><strong>Finishing:</strong> Tri-Folding</li></ul>"
				}
			]]

			Example 7
			Prompt: "what are the types of uv and lam i could do on a postcard?"

			JSON Response:
			[
				{
					"message": "Here are the types of UV and laminations you can apply on a postcard."
				}, 
				{}, 
				{
					"html_unordered_list_of_specs": "<ul style=\"list-style: none; padding: 0; margin: 0; font-family: Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;\"><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #007bff; font-size: 11px;\"><strong>UV Coating Options:</strong><ul><li>1 sided Gloss UV Coating</li><li>2 sided Gloss UV Coating</li></ul></li><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #28a745; font-size: 11px;\"><strong>Lamination Options:</strong><ul><li>1 sided Gloss Lamination</li><li>2 sided Gloss Lamination</li><li>1 sided Matte Lamination</li><li>2 sided Matte Lamination</li></ul></li></ul>"
				}
			]

			Example 8
			Prompt: "What are the uncoated cover options?"

			JSON Response:
			[
				{
					"message": "Here are the uncoated cover options Thad."
				},
				{},
				{
					"html_unordered_list_of_specs": "<ul style=\"list-style: none; padding: 0; margin: 0; font-family: Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;\"><li style=\"background-color: #fff; padding: 4px; border-left: 4px solid #007bff; font-size: 11px;\"><strong>Uncoated Cover Options:</strong><ul><li>Accent Opaque Cover Digital & Cut Sizes 80# 18x12 White</li><li>Everyday Digital Cover Uncoated 100# 18x12 White</li><li>Accent Opaque Cover Digital & Cut Sizes 120# 18x12 White</li><li>Everyday Digital Smooth Cover Uncoated 120# 19x13 White</li></ul></li></ul>"
				}
			]
			
			If choosing to simply respond in the chat and not update anything, respond with [{ "message": "string" }, {}, {}]
			`;

		let messages = getPreviousMessages();
		console.log('messages', messages);
		let systemMessage = {"role": "system", "content": generateOpenAIRequest};
		console.log('systemMessage', systemMessage);
		// check if messages is a string and if jso json parse it
		if (typeof messages === 'string') {
			messages = JSON.parse(messages);
		}
		// now prepend it to messages
		messages.unshift(systemMessage);
		userRequest = {"role": "user", "content": userRequest};
		messages.push(userRequest);

		let command = generateOpenAIRequest + userRequest;
		let prompt = [
			{"role": "system", "content": command}
		];
		let model = "gpt-4o";
		// let model = "gpt-4-0125-preview";
		let image = await didTheyUploadAnImage();
		if (image) {
			console.log('image')
			// prompt.push({"role": "user", "content": {"type":"image_url" , "image_url":{"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"}}});
			prompt.push({"role": "user", "content": [{"type": "text", "text": userRequest}, {"type":"image_url" , "image_url":{"url": image}}]});
		} else {
			console.log('no image')
		}


		// fetch('https://api.openai.com/v1/chat/completions', {
		fetch('https://internal2.ps-az-int.us/api/ai-estimator', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Basic aW50ZXJuYWwyOmZpcDk4MiQ0eTV0eXBoJXdocmc5'
			},
			body: JSON.stringify({
				messages: messages,
				model: model
				// system: generateOpenAIRequest
		})
		}).then(response => response.json())
		.then(data => {
			addDescriptionWarning();
			// clear the file input 
			document.querySelector('#fileUpload').value = '';
			// remove the last message in the chatwindow
			deleteLastMessage();
			updateContainer.style.display = 'block';
			let test = data.choices[0].message.content;
			console.log('data', test);
			// strip all ` from the response
			// let dataJson = data.content[0].text.replace(/`/g, '');
			let dataJson = data.choices[0].message.content.replace(/`/g, '');
			// and remove json if it is the first 4 characters
			if (dataJson.substring(0, 4) === 'json') {
				dataJson = dataJson.substring(4);
			}
			try {
				dataJson = JSON.parse(dataJson);
				console.log('dataJson', dataJson);
				addMessage(dataJson, false);
				updateTheDom(dataJson[1]);
				addRLHF();
				// if dataJson[2]
				if (dataJson[2]) {
					updateTheResponse(dataJson[2]);
				} else {
					updateTheResponse({html_unordered_list_of_specs: 'No suggestions or specs'})
				}
			} catch (error) {
				console.error(error);
				alert('There was an error with the response, please try again')
				updateMessage.textContent = '';
				updateContainer.style.display = 'none';
			}
		}).catch(error => {
			console.error(error);
			alert('There was an error with the response, please try again');
			updateMessage.textContent = '';
			updateContainer.style.display = 'none';
			document.querySelector('#requestQuote').style.display = 'block';
		});

		return true; // Keep the messaging channel open for asynchronous response

		function addRLHF() {
			let chatWindowContainer = document.querySelector('#chatWindowContainer');
			let updateContainer = document.querySelector('#updateContainer');  // Define this before using it
			let rlhfSection = chatWindowContainer.querySelector('#rlhf');
		
			if (!rlhfSection) {
				let rlhf = document.createElement('div');
				rlhf.id = 'rlhf';
				rlhf.innerHTML = `<div class="thumbs">
									<span class="thumbs-up">👍</span>
									<span class="thumbs-down">👎</span>
								  </div>
								  <div class="rlhf-reason hidden">
									<textarea placeholder="Please provide a reason for your rating"></textarea>
									<div class="rlhf-buttons">
										<button class="reason-cancel">Cancel</button>
										<button class="reason-submit">Submit</button>
									</div>
								  </div>
								 `;
		
				// Insert the rlhf section before the updateMessage, which is a child of updateContainer
				chatWindowContainer.insertBefore(rlhf, updateContainer);
			}

			addRLHFListeners();
		}

		function sendRating(rating, reason, chat) {
			fetch('https://internal2.ps-az-int.us/api/ai-estimator-rlhf', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic aW50ZXJuYWwyOmZpcDk4MiQ0eTV0eXBoJXdocmc5'
				},
				body: JSON.stringify({
					rating: rating,
					reason: reason,
					chat: chat
				})
			});

			let reasonArea = document.querySelector('.rlhf-reason');
			reasonArea.classList.add('hidden');
			alert('Thank you for your feedback!');
		}

		function addRLHFListeners() {
			let thumbsUp = document.querySelector('.thumbs-up');
			let thumbsDown = document.querySelector('.thumbs-down');
			let reasonCancel = document.querySelector('.reason-cancel');
			let reasonSubmit = document.querySelector('.reason-submit');

			reasonCancel.addEventListener('click', () => {
				let reason = document.querySelector('.rlhf-reason');
				let textarea = reason.querySelector('textarea');
				textarea.value = '';
				textarea.placeholder = 'Please provide a reason for your rating';
				reason.classList.add('hidden');
			});

			reasonSubmit.addEventListener('click', () => {
				let reason = document.querySelector('.rlhf-reason');
				let textarea = reason.querySelector('textarea');
				let reasonText = textarea.value;
				let chatHolder = document.querySelector('#chatHolder');
				let chat = chatHolder.dataset.chat;
				// now check which class is on the reason div and then get the data-chat from #chatHolder and send it to the server
				if (reason.classList.contains('positive-reason')) {
					// send the data-chat to the server
					sendRating('positive', reasonText, chat);
				}
				if (reason.classList.contains('negative-reason')) {
					// send the data-chat to the server
					sendRating('negative', reasonText, chat);
				}
			});

			thumbsUp.addEventListener('click', () => {
				let reason = document.querySelector('.rlhf-reason');
				let reasonText = reason.querySelector('textarea');
				reason.classList.remove('positive-reason');
				reason.classList.remove('negative-reason');
				if (reason.classList.contains('hidden')) {
					reason.classList.remove('hidden');
				}
				reason.classList.add('positive-reason');
				reasonText.placeholder = 'Please provide a reason for your positive rating';
			});

			thumbsDown.addEventListener('click', () => {
				let reason = document.querySelector('.rlhf-reason');
				let reasonText = reason.querySelector('textarea');
				reason.classList.remove('positive-reason');
				reason.classList.remove('negative-reason');
				if (reason.classList.contains('hidden')) {
					reason.classList.remove('hidden');
				}
				reason.classList.add('negative-reason');
				reasonText.placeholder = 'Please provide a reason for your negative rating';
			});

		}

		function addDescriptionWarning() {
			let descriptionEl = document.querySelector('div.column-right.productDesc');
			if (descriptionEl) {
				let parent = descriptionEl.parentElement;
				let leftColumn = parent.querySelector('div.column-left');
				if (leftColumn) {
					leftColumn.classList.add('warning');
					leftColumn.innerHTML = 'Description:<br>Type to save!';
					
				}
			}
		}

		function deleteLastMessage() {
			//delete all div.delete-message
			let messages = document.querySelectorAll('.delete-message');
			messages.forEach((message) => {
				// get the .ai-message parent
				let parent = message.parentElement;
				parent.remove();
			});
		}

		function updateTheResponse(data) {
			// update the #chatResponse body with the html string in the object {"html_unordered_list_of_specs": "string"}
			let chatResponse = document.querySelector('#chatResponse');
			chatResponse.innerHTML = data.html_unordered_list_of_specs;
		}

		function unlockAllFields() {

			let fields = document.querySelectorAll('.cost_line_price');
			fields.forEach((field) => {
				let lock = field.querySelector('.lock');
				if (lock) {
					lock.click();
				}
			});

			fields = document.querySelectorAll('.cost_line_wholesale');
			fields.forEach((field) => {
				let lock = field.querySelector('.lock');
				if (lock) {
					lock.click();
				}
			});
		
		}

		function didTheyUploadAnImage() {
			return new Promise((resolve, reject) => {
				let fileUpload = document.querySelector('#fileUpload');
				if (fileUpload.files.length > 0) {
					let file = fileUpload.files[0];
					let reader = new FileReader();
					
					reader.onload = () => {
						resolve(reader.result); // Resolve the promise with the Base64 string
					};
					reader.onerror = (error) => {
						reject(error); // Reject the promise if there's an error
					};
					
					reader.readAsDataURL(file);
				} else {
					resolve(null); // Resolve the promise with null if no file is uploaded
				}
			});
		}
		
		function updateProgressBar(progress, total) {
			let updateProgress = document.querySelector('#updateProgress');
			if ((progress / total) * 100 === 100) {
				updateProgress.style.width = '0%';
			} else {
				updateProgress.style.width = `${(progress / total) * 100}%`;
			}
		}

		async function deleteAllTasks() {
			let lines = document.querySelectorAll('.cost_line_edit');
			lines.forEach((line) => {
				let span = line.querySelector('span.delete');
				if (span) {
					setTimeout(() => {
						span.click();
					}, 1000);
				}
			});
		}

		async function updateTheDom(dataJson) {
			
			await deleteAllTasks();
			// Check if dataJson is an object
			if (typeof dataJson === 'object') {
			  let selectElements = ['#productType', '#category', '#productID', '#paperType', '#device', '#inksF', '#inksB', '#paperID'];
			  let textElements = ['#art_size', '#cut_size', '#finish_size']; 
			  let straightUp = ['#productDesc', "#quantity0", "#quantity1", "#quantity2", "#numPages", "#sheets", "#padding", "#versions"];
			  let weirdLinkClicks = ['#Text_FoldingTF', '#Text_FoldingZF', '#Text_FoldingSF', '#Text_FoldingPP', '#Text_FoldingQF', '#Cover_FoldingSF', '#Cover_FoldingPP', '#Cover_FoldingZF', '#CoverFoldingTF1', '#Cover_FoldingQF', '#WF4grommets', '#WF4round-corner', '#WF1GloOve', '#WF1MatOve', '#WF2banner_grommets', '#WF2banner_hemming', '#WF2banner_wind_slits', '#BindingB2', '#B3corner-staple', '#BindingB4', '#BindingB6', '#BindingB5', '#G2GlossLam', '#G2MatteLam', '#G2GlossUV', '#G1GlossLam', '#G1MatteLam', '#G1GlossUV', '#Corner_RoundingCR3', '#Corner_RoundingCR2', '#Corner_RoundingCR1', '#DC2Med_Speed_DC', '#DC3Complex_Cuts', '#D1Half', '#D1Quarter', '#D1Eighth', '#D2Half', '#D2Quarter', '#D2Eighth', '#D3Half', '#D3Quarter', '#D3Eighth', '#PaddingP25', '#PaddingP50', '#PaddingP100', '#PerforateP1', '#PerforateP2', '#Text_ScoringS1', '#Text_ScoringS2', '#Text_ScoringS3', '#Text_ScoringS4', '#Cover_ScoringS1', '#Cover_ScoringS2', '#Cover_ScoringS3', '#Cover_ScoringS4'];
			  let textAreas = ['#productionNote', '#estimateNote'];
			  let straitClick = ['#isFolded'];
				let total = Object.keys(dataJson).length;
				let progress = 1;
			let operationReadable = {
				"#productType": "Type", // Product Type: Printed, Service, Inventory
				"#category": "Category", // Product category
				"#productID": "ID", // Always "custom"
				"#device": "Device", // Device code
				"#productDesc": "Description", // Short description
				"#paperType": "Paper", // Always "None"
				"#inksF": "Inks F", // Front side inks
				"#inksB": "Inks B", // Back side inks
				"#isFolded": "Folded?", // If folded booklet
				"#numPages": "Pages", // Number of sheets
				"#sheets": "Sheets", // Number of pages
				"#padding": "Padding", // Sheets to pad
				"#versions": "Versions", // Job versions
				"#paperID": "Paper ID", // Paper identifier
				"#art_size": "Art Size", // Art size with bleed
				"#cut_size": "Cut Size", // Cut size of product
				"#finish_size": "Finish Size", // Finished size
				"#quantity0": "Quantity 1", // First quantity
				"#quantity1": "Quantity 2", // Second quantity
				"#quantity2": "Quantity 3", // Third quantity
				"#BindingB2": "Saddle Stitch", // Machine Saddle Stitching
				"#B3corner-staple": "Corner Staple", // Corner Staple
				"#BindingB4": "Coil Bind", // Coil Binding
				"#BindingB6": "Black Back", // Black Back Covers
				"#BindingB5": "Clear Front", // Clear Front Covers
				"#G2GlossLam": "2S Gloss Lam", // 2 sided Gloss Lam
				"#G2MatteLam": "2S Matte Lam", // 2 sided Matte Lam
				"#G2GlossUV": "2S Gloss UV", // 2 sided Gloss UV
				"#G1GlossLam": "1S Gloss Lam", // 1 sided Gloss Lam
				"#G1MatteLam": "1S Matte Lam", // 1 sided Matte Lam
				"#G1GlossUV": "1S Gloss UV", // 1 sided Gloss UV
				"#Corner_RoundingCR3": "1/2\" Corner", // 1/2 in. Corner Round
				"#Corner_RoundingCR2": "1/4\" Corner", // 1/4 in. Corner Round
				"#Corner_RoundingCR1": "1/8\" Corner", // 1/8 in. Corner Round
				"#DC2Med_Speed_DC": "Med Speed DC", // Med Speed Die Cutter
				"#DC3Complex_Cuts": "Complex Cuts", // Complex Cuts Die Cutter
				"#D1Half": "1/2\" Hole", // 1/2 in. hole drilled
				"#D1Quarter": "1/4\" Hole", // 1/4 in. hole drilled
				"#D1Eighth": "1/8\" Hole", // 1/8 in. hole drilled
				"#D2Half": "2x 1/2\" Hole", // 2x 1/2 in. holes
				"#D2Quarter": "2x 1/4\" Hole", // 2x 1/4 in. holes
				"#D2Eighth": "2x 1/8\" Hole", // 2x 1/8 in. holes
				"#D3Half": "3x 1/2\" Hole", // 3x 1/2 in. holes
				"#D3Quarter": "3x 1/4\" Hole", // 3x 1/4 in. holes
				"#D3Eighth": "3x 1/8\" Hole", // 3x 1/8 in. holes
				"#PaddingP25": "Pad in 25s", // Pad in 25's
				"#PaddingP50": "Pad in 50s", // Pad in 50's
				"#PaddingP100": "Pad in 100s", // Pad in 100's
				"#PerforateP1": "1 Perforation", // 1 perforation
				"#PerforateP2": "2 Perforations", // 2 perforations
				"#Text_ScoringS1": "1 Score Text", // 1 score text weight
				"#Text_ScoringS2": "2 Score Text", // 2 scores text weight
				"#Text_ScoringS3": "3 Score Text", // 3 scores
				"#Text_ScoringS4": "4 Score Text", // 4 scores text weight
				"#Cover_ScoringS1": "1 Score Cover", // 1 score cover weight
				"#Cover_ScoringS2": "2 Score Cover", // 2 scores cover weight
				"#Cover_ScoringS3": "3 Score Cover", // 3 scores cover weight
				"#Cover_ScoringS4": "4 Score Cover", // 4 scores cover weight
				"#Text_FoldingTF": "Tri-Fold Text", // Text weight Tri-Folding
				"#Text_FoldingZF": "Z-Fold Text", // Text weight Z-Folding
				"#Text_FoldingSF": "Half-Fold Text", // Text weight Half-Folding
				"#Text_FoldingPP": "Double-Parallel Text", // Text weight Double-Parallel-Folding
				"#Text_FoldingQF": "Quarter-Fold Text", // Text weight Quarter-Folding
				"#Cover_FoldingSF": "Half-Fold Cover", // Cover weight Half-Folding
				"#Cover_FoldingPP": "Double-Parallel Cover", // Cover weight Double-Parallel-Folding
				"#Cover_FoldingZF": "Z-Fold Cover", // Cover weight Z-Folding
				"#CoverFoldingTF1": "Tri-Fold Cover", // Cover weight Tri-Folding
				"#Cover_FoldingQF": "Quarter-Fold Cover", // Cover weight Quarter-Folding
				"#WF4grommets": "Grommets WF", // Grommets for wide format
				"#WF4round-corner": "Round Corners WF", // Round Corners for wide format
				"#WF1GloOve": "Gloss Lam WF", // Gloss laminate for wide format
				"#WF1MatOve": "Matte Lam WF", // Matte laminate for wide format
				"#WF2banner_grommets": "Banner Grommets", // Grommets for wide format banner
				"#WF2banner_hemming": "Banner Hemming", // Hemming for wide format banner
				"#WF2banner_wind_slits": "Banner Wind Slits", // Wind slits for wide format banner
				"#CutPerHour-30WFC1": "30/hr Router WF", // Router cutting 30 pieces per hour
				"#CutPerHour-60WFC2": "60/hr Router WF", // Router cutting 60 pieces per hour
				"#CutPerHour-100WFC3": "100/hr Router WF", // Router cutting 100 pieces per hour
				"#CutPerHour-200WFC4": "200/hr Router WF", // Router cutting 200 pieces per hour
				"#CutPerHour-350WFC5": "350/hr Router WF", // Router cutting 350 pieces per hour
				"#CutPerHour-500WFC6": "500/hr Router WF", // Router cutting 500 pieces per hour
				"#Hand_FoldingH1": "Hand Fold 1x", // Hand Folding 1 fold
				"#Hand_FoldingH2": "Hand Fold 2x", // Hand Folding 2 folds
				"#Mail_PrepM1": "Mail Prep", // Extra work for mailing
				"#AddressingI2": "Var Data Press", // Variable data on press
				"#AddressingI1": "Var Data Inkjet" // Variable data on inkjet
			};		

			  for (const [key, value] of Object.entries(dataJson)) {
				// check if the key exists in operationReadable
				let updateInfo = 'Quote Details';
				if (operationReadable[key]) {
					updateInfo = operationReadable[key];
				}
				updateMessage.textContent = `Updating ${updateInfo}...`;
				updateProgressBar(progress, total);
				progress++;
				let success = false;
				let attempts = 0;
		  
				if (weirdLinkClicks.includes(key)) {
					if (value !== false && value !== 'false') {
						while (!success && attempts < 1) {
							success = await updateWeirdLinkClicks(key, value);
							attempts++;
							await delay(2000);
						}
					}
				} else if (selectElements.includes(key)) {
				  // Use a loop with await to ensure updateSelectElement is called asynchronously in sequence
				  // Keep trying to update the select element until successful or too many attempts
				  while (!success && attempts < 1) {
					success = await updateSelectElement(key, value);
					attempts++;
					await delay(2000);
				  }
		  
				  if (!success) {
					console.error(`Failed to update select element for ${key} after ${attempts} attempts.`);
				  }
				} else if (straightUp.includes(key)) {
					if (value !== false && value !== 'false') {
						while (!success && attempts < 1) {
							success = await updateStraightUpElement(key, value);
							attempts++;
							await delay(1500);
						}
					}
				} else if (textElements.includes(key)) {
				  while (!success && attempts < 1) {
					success = await updateTextElement(key, value);
					attempts++;
					await delay(1000);
				  }
				// } else if (weirdLinkClicks.includes(key)) {
				// 	if (value !== false && value !== 'false') {
				// 		while (!success && attempts < 1) {
				// 			success = await updateWeirdLinkClicks(key, value);
				// 			attempts++;
				// 			await delay(3000);
				// 		}
				// 	}
				} else if (straitClick.includes(key)) {
					while (!success && attempts < 1) {
						success = await justClickElement(key, value);
						attempts++;
						await delay(1000);
					}
				} else if (textAreas.includes(key)) {
					while (!success && attempts < 1) {
						success = await updateTextArea(key, value);
						attempts++;
						await delay(1000);
					}
				}
			  }
		  
				runEstimate(); // You might want to call this after all updates are done
				// show the request button again
				let requestQuote = document.querySelector('#requestQuote');
				updateContainer.style.display = 'none';
			} else {
				console.error('dataJson is not an object');
				updateContainer.style.display = 'none';
				// send the message to the user that there was an error in the chat window
				addMessage([{message: 'There was an error with the response, please try again'}], false);
			}
			requestQuote.style.display = 'block';
		}

		async function updateTextArea(key, value) {
			// its just a text area, update the value then press enter
			let textEl = document.querySelector(key);
			if (textEl) {
				textEl.value = value;
				textEl.focus();
				textEl.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
				return true;
			}
		}

		async function justClickElement(key, value) {
			// just find the element that is the "key" and then click it
			let element = document.querySelector(key);
			if (element) {
				// if its a checkbox check that it's unchecked first then click it
				if (element.type === 'checkbox' && !element.checked) {
					element.click();
				} else if (element.type !== 'checkbox') {
					element.click();
				}
				return true;
			}
		}

		async function updateWeirdLinkClicks(key, value) {
			// just find the element that anchor inside the element that is the "key" and then click it
			let element = document.querySelector(key);
			if (element) {
				let anchor = element.querySelector('a');
				if (anchor) {
					anchor.click();
					return true;
				}
			} 
		}

		async function updateStraightUpElement(key, value) {
			let textEl = document.querySelector(key);
			textEl.disabled = false;
			if (textEl) {
				console.log('textEl exists')
				if (key == '#productDesc') {
					console.log('is in productDesc');
					let lock = document.querySelector('#PrDesLock');
					if (lock && lock.classList.contains('lock')) {
						console.log('clicking the lock');
						lock.click();
					}
					textEl.value = value;
					// then trigger a focus into the element and then press enter to update the value
					textEl.focus();
					textEl.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
					// again
					textEl.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
					console.log('both events,,,,, done');

				} else if (key == '#sheets') {
					console.log('is in sheets');
					let sheets = document.querySelector('#sheets');
					if (sheets) {
						sheets.value = value;
						sheets.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
					}
				} else {
					console.log('updateing', key)
					console.log('here is the element', textEl)
					console.log('here is the original value', textEl.value)
					textEl.value = value;
					textEl.focus();
					delay(200);
					textEl.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
					delay(200);
					//dispatch a tab press
					textEl.dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab'}));
					console.log('dispatched the tab')
					console.log('here is the new value', textEl.value)
				}
				return true;
			} else {
				console.log('textEl doesnt exist', key)
			}
		}

		function updateTextElement(key, value) {
			// just get the element then get the parent, then the input inside the parent then set the value to the value
			let textEl = document.querySelector(key);
			if (textEl) {
				let parent = textEl.parentElement;
				let inputEl = parent.querySelector('input');
				if (inputEl) {
					inputEl.value = value;
					// then put the cursor in the input and hit enter
					inputEl.focus();
					inputEl.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
					return true;
				}
			}
		}

		function delay(milliseconds) {
			return new Promise(resolve => setTimeout(resolve, milliseconds));
		}

		function getPreviousMessages() {
			// get the last 6 messages (both user and ai) in the chat window and if there is a dataset config on it get that too and concatenate them into a string like a dialogue
			// console.log('getting previous messages');
			// let chatWindow = document.querySelector('#chatWindow');
			// let messages = chatWindow.querySelectorAll('div');
			// // remove the elements that have .delete-message class
			// let count = 0;
			// let messageArray = [];
			// console.log('messages', messages);
			// console.log('messages.length', messages.length);
			// if (messages.length < 4) {
			// 	console.log('no messages')
			// 	return messageArray;
			// }
			// for (let i = messages.length - 1; i >= 0; i--) {
			// 	if (count === 12) {
			// 		break;
			// 	}
			// 	let messObj = {};
			// 	let message = messages[i];
			// 	if ((message.classList.contains('user-message') || message.classList.contains('ai-message')) && !message.classList.contains('delete-message')) {
			// 		messObj.role = message.classList.contains('user-message') ? 'user' : 'assistant';
			// 		messObj.content = message.dataset.config ? JSON.parse(message.dataset.config) : message.textContent;
			// 		messageArray.push(messObj);
			// 		count++;
			// 	}
			// }
			// return messageArray;

			let chatHolder = document.querySelector('#chatHolder');
			if (!chatHolder || !chatHolder.dataset.chat) {
				return [];
			}
			console.log('getting the chat', chatHolder.dataset.chat)
			return JSON.parse(chatHolder.dataset.chat);
		}

		function addMessage(message, isUser, isWaiting = false) {
			console.log('adding message', message, isUser, isWaiting)
			try {
				let chatHolder = document.querySelector('#chatHolder');
				if (!chatHolder) {
					chatHolder = document.createElement('div');
					chatHolder.id = 'chatHolder';
					document.body.appendChild(chatHolder);

				}
				let chatJSON = chatHolder.dataset.chat;
				// check if chatJSON is valid json
				if (!chatJSON) {
					chatJSON = [];
				} else {
					chatJSON = JSON.parse(chatJSON);
				}
				let newMessage = {};
				// in this one we want to create a div with the message and then append it to the chat window and give it the class of ai-message
				let chatWindow = document.querySelector('#chatWindow');
				let aiMessage = document.createElement('div');
				if (!isUser) {
					if (isWaiting) {
						aiMessage.classList.add('ai-message');
						aiMessage.innerHTML = message;
					} else {
						if (message) {
							// if it is an object then stringify it
							let jsonMessage = '';
							if (typeof message === 'object') {
								jsonMessage = JSON.stringify(message);
							} else {
								jsonMessage = message;
							}
							newMessage.role = 'assistant';
							newMessage.content = jsonMessage;
							chatJSON.push(newMessage);
						}
						aiMessage.classList.add('ai-message');
						aiMessage.textContent = message[0]['message'];
						aiMessage.dataset.config = JSON.stringify(message);
					}
				} else {
					if (message) {
						console.log('messages exist', message)
						newMessage.role = 'user';
						newMessage.content = message;
						chatJSON.push(newMessage);
					}
					aiMessage.classList.add('user-message');
					aiMessage.innerHTML = message;
				}

				chatHolder.dataset.chat = JSON.stringify(chatJSON);

				chatWindow.appendChild(aiMessage);
				// now make the window scroll to the bottom
				chatWindow.scrollTop = chatWindow.scrollHeight;
			} catch (error) {
				console.error(error);
				alert('couldnt add message', error);
			}

		}

		function runEstimate() {
			updateMessage.textContent = 'Calculating estimate...';
			let estimateButton = document.querySelector('#btnEst');
			if (estimateButton) {
				estimateButton.click();
			}
			// now a timeout to wait for the estimate to finish
			setTimeout(() => {
				updateMessage.textContent = '';
			}, 1000);
		}

		async function updateSelectElement(key, value) {
			// console.log('is in select elements')
			// updateSelectElement(key, value);
			let selectEl = document.querySelector(key);

			if (selectEl) {

				// search for the value in the values of the options of the select element and then if you find it make that option selected and make the index the selected index
				let options = selectEl.options;
				let optionIndex = -1;
				let optionText = '';
				for (let i = 0; i < options.length; i++) {
					if (options[i].value === value) {
						optionIndex = i;
						optionText = options[i].innerText;
						break;
					}
				}
				if (optionIndex !== -1) {
					selectEl.selectedIndex = optionIndex;
					// also find the nearest input element and set the value to the value
					// get the parent
					// find the parent then get the a under the ui-
					let parent = selectEl.parentElement;
					if (parent) {
						let a = parent.querySelector('.ui-combobox a');
						if (a) {
							a.click();
							let uiList = {
								"#productType": "#ui-id-1",
								"#category": "#ui-id-2",
								"#productID": "#ui-id-3",
								"#device": "#ui-id-5",
								"#inksF": "#ui-id-6",
								"#inksB": "#ui-id-7",
								"#paperType": "#ui-id-8",
								"#paperID": "#ui-id-9",
							}
							// console.log('uiList', uiList);
							if (uiList[key]) {
								// console.log('uiList[key]', uiList[key]);
								let visualList = document.querySelector(uiList[key]);
								if (visualList) {
									// console.log('visualList', visualList);
									let liElements = visualList.querySelectorAll('li');
									liElements.forEach((li) => {
										let anch = li.querySelector('a');
										// console.log('anch', anch.textContent);
										// console.log('optionText', optionText);
										if (anch.textContent === optionText) {
											console.log('clicking the anchor');
											anch.click();
											// return true;
											// need to break the await
											console.log('returning true');
											return new Promise((resolve) => {
												resolve(true);
											});
										}
									});
								}
							}
						}
					}
				}
				return false;
			}
			return false;
		}

		function clearOptions(dataJson = null) {
			updateMessage.textContent = 'Clearing options...';
			// need to clear the #category, the #paperType, #productID, and #device and the inputs for those
			let category = document.querySelector('#category');
			let productID = document.querySelector('#productID');
			let paperType = document.querySelector('#paperType');

			// dataJson ? setCategory(dataJson) : setToNone(category);
			setToNone(category);
			setToNone(productID);
			setToNone(paperType);

			// runEstimate();

			updateMessage.textContent = 'Options cleared.';

			function setToNone(selectEl) {
				if (selectEl) {
					selectEl.selectedIndex = 0;
					let parent = selectEl.parentElement;
					let inputEl = parent.querySelector('input');
					if (inputEl) {
						inputEl.value = '';
					}
				}
			}

			function setCategory(dataJson) {
				let newCategory = dataJson['#category'];
				let category = document.querySelector('#category');
				if (category) {
					category.value = newCategory;
					let parent = category.parentElement;
					let inputEl = parent.querySelector('input');
					if (inputEl) {
						inputEl.value = newCategory;
					}
				}
				runEstimate();
			}
		}
	}


}

class PrepPriceMaster {
	// just find #quoteLineItems button.jqButton.btnAdd and updatethe onclick to call the function thi.popNewItemNewAI

	constructor() {
		this.updateButton();
	}

	updateButton() {
		let button = document.querySelector('#quoteLineItems button.jqButton.btnAdd');
		if (button) {
			let parent = button.parentElement;
			let newButton = document.createElement('button');
			newButton.classList = button.classList;
			newButton.value = "NEW";
			newButton.innerText = "Job";
			console.log('removing button')
			button.remove();
			// now parent prepend the new button
			parent.prepend(newButton);
			newButton.addEventListener('click', this.popNewItemNewAI);
		}
	}

	popNewItemNewAI() {
		// ge tthe quote id from the params
		let displayName = document.querySelector('.userDisplayName');
		if (displayName) {
			displayName = displayName.textContent;
			let params = new URLSearchParams(window.location.search);
			let quoteID = params.get('quoteID');
			var w = window.open("/s2/jobs.php?quoteID=" + quoteID + "&taxable=N&task=add&user=" + displayName, "", "width=1155,height=768,status=no,resizable=yes,scrollbars=yes");
			w.focus();
		}
		return false;
	}
}

let url = window.location.href;
if (url.includes('printingsolutions.mypresswise.com/s2/jobs.php?quoteID')) {
	// get the query param user
	let params = new URLSearchParams(window.location.search);
	let userName = params.get('user');
	if (userName && userName !== '') {
	} else {
		userName = '';
	}
	let priceMaster = new PriceMaster(userName);
}


if (url.includes('printingsolutions.mypresswise.com/s/cost.php?quoteID')) {
	let prepPriceMaster = new PrepPriceMaster();
}