export default {
	async aggiornaTabs() {
		storeValue('selectedTab',tabs.selectedTab);
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
	}
}