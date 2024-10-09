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
		}
	},
	async initLoad() {
		storeValue('selectedTab',"Elenco");
		await getAllDistretti.run();
		await getAllIstanzeDistretto.run();
		await getAllDeterminePagamenti.run();
	},
	cangeTabs() {
		this.aggiornaTabs();
	}
}