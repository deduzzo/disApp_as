export default {
	aggiornaQueryTabs() {
		getAllPagamentiDisDet.run();
		getConteggiTotaliDetermina.run()
	},
	aggiornaTabs() {
		storeValue('selectedTab',tabs.selectedTab);
		switch(tabs.selectedTab) {
				case "Pagamenti":
				this.aggiornaQueryTabs();
				break;
		}
	}
}