export default {
	secret: "UxZ>69'[Tu<6",
	allFilesIstanza: [],
	folderIdIstanzaSelezionata: null,

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
				this.getAllFilesOfIstanzaSelezionata();
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
		this.allFilesIstanza = [];
		//await getAllDistretti.run();
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
	},
	verifyTokenExpires: () => {
		let expired = false;
		console.log(appsmith.store.token);
		if (appsmith.store.token !== null) {
			try {
				const decoded = jsonwebtoken.verify(appsmith.store.token, this.secret);
				//console.log("decoded:");
				//console.log(decoded);
				const newToken = this.createToken({data: decoded.data});
				//console.log("new token");
				//console.log(newToken);
				storeValue("token",newToken);
				//console.log("token ok");
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
			navigateTo("Login");
		}
		return {expired}

	},
	createToken: (user) => {
		return jsonwebtoken.sign(user, this.secret, {expiresIn: 60*60});
	},
	async findFolder() {
		try {
			const response = await getAllFilesAndFolderGdrive.run({folderName: ""});

			//return (response.files.count >0)
		} catch (error) {
			console.error('Errore durante la verifica della cartella:', error);
		}
	},
	aggiornaScheda() {
		storeValue("selectedRowId",disabile_select.selectedOptionValue);
		file_loading_txt.setText("");
		this.allFilesIstanza = [];
		this.folderIdIstanzaSelezionata = null;
		this.getAllFilesOfIstanzaSelezionata().then(() => {});
	},
	async getAllFilesOfIstanzaSelezionata() {
		let folderId = null;
		file_loading_txt.setText("caricamento lista files in corso...");
		console.log("inizio");
		if (appsmith.store.selectedRowId !== null) {
			console.log("verifico se la cartella esiste");
			let existingFolder = await getAllFilesAndFolderGdrive.run({filterName: appsmith.store.selectedRowId.toString(),folderId: gdriveHelper.mainFolderId});
			console.log(existingFolder);
			if (existingFolder && existingFolder.files.length === 0) {
				console.log("la cartella non esiste, creiamola");
				let res = await createFolderToGdrive.run(
					{
						folderName: "#"+ appsmith.store.selectedRowId.toString() + " - " + disabile_select.selectedOptionLabel,
						parentFolderId: gdriveHelper.mainFolderId
					})
				console.log("cartella creata")
				console.log(res);
				if (res.id)
					folderId = res.id;
			}
			else if (existingFolder && existingFolder.files.length === 1) {
				folderId = existingFolder.files[0].id;
				console.log("cartella esistente, id" + folderId);
			}
			console.log("ricaviamo la lista dei file");
			console.log("folderid: " + folderId)
			this.folderIdIstanzaSelezionata = folderId;
			let allFilesOfIstanza = await getAllFilesAndFolderGdrive.run({folderId: this.folderIdIstanzaSelezionata});
			console.log(allFilesOfIstanza.files);
			this.allFilesIstanza = allFilesOfIstanza.files;
			allFilesOfIstanza.files.length > 0 ? file_loading_txt.setText(allFilesOfIstanza.files.length + " files presenti per l'istanza selezionata"): file_loading_txt.setText("nessun file presente per l'istanza selezionata");
		}
		else
			console.log("nessuna istanza selezionata");
	},
	getTipoNuoviFiles () {
		let keys = Object.keys(gdriveHelper.fileType);
		let out = [];
		for (let k of keys) {
			out.push({key: k, value: gdriveHelper.fileType[k]});
		}
		return out;
	},
	uploadFileScheda() {
		if (this.folderIdIstanzaSelezionata && file_scheda.files.length >0 && tipo_nuovo_file_select.selectedOptionValue ) {
			let filename = tipo_nuovo_file_select.selectedOptionValue + "#" + descrizione_file_scheda_txt.text + "#" + file_scheda.files[0].name;
			uploadFileToGDrive.run({fileName:filename,folderId: this.folderIdIstanzaSelezionata, file: file_scheda.files[0] })
				.then(() => {
				console.log("ok");
				showAlert("Caricamento file avvenuto con successo", "success")
				this.aggiornaScheda();
				resetWidget("Form2")
			}).catch((err) => {
				console.log(JSON.stringify(err));
				showAlert("Errore nel caricamento del file", "error" )
			});

		}
	}

}