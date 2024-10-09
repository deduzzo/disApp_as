export default {
	aggiornaQueryTabs() {
		getConteggiTotaliDetermina.run();
		getAllPagamentiDisDet.run();
		getAllIstanzeDistretto.run();
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