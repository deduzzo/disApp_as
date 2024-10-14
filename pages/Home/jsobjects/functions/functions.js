export default {
	secret: "UxZ>69'[Tu<6",

	async aggiornaTabs() {
		storeValue('selectedTab',tabs.selectedTab);
		this.verifyTokenExpires();
		switch(tabs.selectedTab) {
			case "Pagamenti":
				await getConteggiTotaliDetermina.run()
				await getAllPagamentiDisDet.run();
				break;
			case "Elenco":
				await getAllIstanzeDistretto.run();
				break;
			case "Scheda":
				disabile_select.setSelectedOption(appsmith.store.selectedRowId ?? null);
				break;
			case "ISEE":
				await getIseeIstanza.run();
				await getLastValidIsee.run()
				break;
		}
	},
	async initLoad() {
		storeValue('selectedTab',"Elenco");
		storeValue("selectedRowId",null)
		//await getAllDistretti.run();
		await getAllDistretti.run();
		await getAllIstanzeDistretto.run();
		await getAllDeterminePagamenti.run();
		await getIseeIstanza.run();
		await getLastValidIsee.run();
	},
	cangeTabs() {
		this.aggiornaTabs();
	},
	returnLast3Years () {
		const currentYear = moment().year();
		let out = [];
		for (let i =0; i<3; i++)
			out.push({
				"name": (currentYear - i).toString(),
				"code": currentYear -i,
			});
		return out;
	},
	mostraModalIsee() {
		let iseeCorrente = getLastValidIsee.data;
		if (iseeCorrente && iseeCorrente.length>0) {
			iseeCorrente = iseeCorrente[0];
			if ( 
				(tipo_nuovo_isee_select.selectedOptionValue === "minore" && iseeCorrente["maggiore_25mila"] === true) || 
				(tipo_nuovo_isee_select.selectedOptionValue === "maggiore" && iseeCorrente["maggiore_25mila"] === false) )
				avverti_isee_txt.setText("ATTENZIONE, l'ISEE corrente è diverso da quello considerato al momento, pertanto verranno effettuati i ricalcoli per un eventuale recupero/rimborso per l'anno corrente.");
			else 
				avverti_isee_txt.setText("");
		}
		showModal(nuovo_isee_modal.name)
	},
	verifyTokenExpires: () => {
		let expired = false;
		console.log(appsmith.store.token);
		if (appsmith.store.token !== null) {
			try {
				const decoded = jsonwebtoken.verify(appsmith.store.token, this.secret);
				console.log(decoded);
				const newToken = this.createToken(decoded);
				console.log("new token");
				console.log(newToken);
				storeValue("token",newToken);
				console.log("token ok");
			} catch (err) {
				console.log(err);
				expired = true;
			}
		}
		else 
			expired = true;
		if (expired) {
			storeValue("token",null);
			console.log("expired..");
			//navigateTo("Login");
		}

	},
	createToken: (user) => {
		return jsonwebtoken.sign(user, this.secret, {expiresIn: 60*60});
	},

}