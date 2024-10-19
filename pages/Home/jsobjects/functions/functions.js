export default {
	secret: "UxZ>69'[Tu<6",
	allFilesIstanza: [],
	folderIdIstanzaSelezionata: null,
	userData: null,
	distrettiDataSelect: [],
	uploadFileInProgress: false,

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
		this.verifyTokenExpires();
		await getAllDistretti.run();
		this.distrettiDataSelect = this.getDistrettiMap();
		//await getAllDistretti.run();
		//await getAllDistretti.run();
		await getAllIstanzeDistretto.run({distretto: this.userData.distretto});
		await getAllDeterminePagamenti.run();
		await getIseeIstanza.run();
		await getLastValidIsee.run();
	},
	getDistrettiMap() {
		if (functions.userData.distretto === undefined || functions.userData.distretto === null || functions.userData.distretto === "" ) {
			return [{ label: "** TUTTI **", value: "all" }, ...getAllDistretti.data.map((obj) => {
				return { label: obj.nome, value: obj.id };
			})];
		}
		else
			return getAllDistretti.data
				.filter((obj) => obj.id === this.userData.distretto)
				.map((obj) => {
				return { label: obj.nome, value: obj.id };
			});
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
				this.userData = {
					username: decoded.data.user, 
					distretto: decoded.data.id_distretto,
					mail: decoded.data.mail
				}
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
		console.log("inizio");
		if (appsmith.store.selectedRowId !== null) {
			file_loading_txt.setText("caricamento lista files in corso...");
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
		else {
			console.log("nessuna istanza selezionata");
			file_loading_txt.setText("E' necessario selezionare un istanza");
		}
	},
	getTipoNuoviFiles () {
		let keys = Object.keys(gdriveHelper.fileType);
		let out = [];
		for (let k of keys) {
			out.push({key: k, value: gdriveHelper.fileType[k]});
		}
		return out;
	},
	uploadFileSchedaOld() {
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
	},

	downloadFile2(fileId) {
		getContentFileFromGdrive.run({fileId: fileId, altMedia: false})
			.then(async (response) => {
			console.log(response);
			getContentFileFromGdrive.run({fileId: fileId, altMedia: true})
				.then(async (response2) => {
				//console.log(response2.blob())
				//response2 = js_base.encode(response2);


				const data = this.textToBinaryArray(response2);


				const blob = new Blob([data]);

				const url = URL.createObjectURL(blob);
				//const url = URL.createObjectURL([data]);
				await download(url, response.name,response.mimeType)
			})
		})
	},
	downloadFile(fileId) {
		getContentFileFromGdrive.run({fileId: fileId, altMedia: true})
			.then(async (response2) => {
			// Supponiamo che response2 sia una stringa base64
			const byteArray = this.textToBinaryArray(response2); // Decodifica la stringa base64 in binario

			// Crea un Blob dal byteArray
			const blob = new Blob([byteArray], { type: 'application/octet-stream' });

			// Crea un URL per il Blob e scarica il file
			const url = URL.createObjectURL(blob);
			await download(url, response.name, "application/octet-stream");
		})
			.catch(error => {
			console.error("Errore nel recupero del file:", error);
		});
	},
	textToBinaryArray(binaryData) {
		// Assumi che 'binaryData' sia un oggetto tipo stringa o un buffer di dati binari
		const len = binaryData.length;

		// Se binaryData è una stringa binaria, usa direttamente Uint8Array
		const bytes = new Uint8Array(len);

		for (let i = 0; i < len; i++) {
			// Copia i byte direttamente nella nuova Uint8Array
			bytes[i] = binaryData.charCodeAt(i) ;  // Mantieni solo il byte meno significativo
		}

		return bytes;
	},
	uploadFileScheda() {
		this.uploadFileInProgress = true;
		this.zipFileAndUploadFileScheda();
	},
	async zipFileAndUploadFileScheda() {
		if (this.folderIdIstanzaSelezionata && file_scheda.files.length >0 && tipo_nuovo_file_select.selectedOptionValue ) {	
			let fileName = tipo_nuovo_file_select.selectedOptionValue + "#" + descrizione_file_scheda_txt.text + "#" + file_scheda.files[0].name;
			const zip = new jszip();
			let fileData = null;
	    if (file_scheda.files[0].size !== file_scheda.files[0].data.length && 
					file_scheda.files[0].data.length < 100 && 
					file_scheda.files[0].data.startsWith("blob:"))
				fileData = await this.getBinaryStringFromBlobUrl(file_scheda.files[0].data)
			else
				fileData = file_scheda.files[0].data;
			zip.file(fileName,btoa(fileData), {binary: true,base64: true});
			const newFileName = fileName.replaceAll(".","_") + ".zip";

			zip.generateAsync({type:"binarystring",compression: "DEFLATE",compressionOptions: { level: 9 }}).then((zipBlob) => {

				let fileZipObj = {type: "application/zip", data: zipBlob, dataFormat: "binary",name: newFileName}

				uploadFileToGDrive.run({fileName:newFileName,folderId: this.folderIdIstanzaSelezionata, file: fileZipObj })
					.then(() => {
					showAlert("Caricamento file avvenuto con successo", "success")
					this.aggiornaScheda();
					this.uploadFileInProgress = false;
					resetWidget("Form2")
				}).catch((err) => {
					console.log(JSON.stringify(err));
					showAlert("Errore nel caricamento del file", "error" )
					this.uploadFileInProgress = false;
				});
			}).catch((er) => console.log(er));
		}
	},
	arrayBufferToBase64(buffer) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	},
	async getBinaryStringFromBlobUrl(blobUrl) {
		try {
			const result = this.extract(blobUrl);

			// Utilizziamo fetch con await per ottenere la risposta
			const response = await fetch(result[0]);

			// Otteniamo il blob dalla risposta
			const blob = await response.blob();

			// Utilizziamo FileReader per leggere il blob come stringa binaria
			const binaryString = await new Promise((resolve, reject) => {
				const reader = new FileReader();

				reader.onloadend = () => {
					// Risolviamo la promessa con il risultato in formato binaryString
					resolve(reader.result);
				};

				reader.onerror = (error) => {
					// Se c'è un errore, rigettiamo la promessa
					reject(error);
				};

				// Leggiamo il blob come binaryString
				reader.readAsBinaryString(blob);
			});

			return binaryString;

		} catch (error) {
			console.error("Errore durante la conversione del blob URL in binaryString: ", error);
			throw error;  // Propaghiamo l'errore se necessario
		}
	},
	extract (blobId) {
		const url = `blob:${window.location.protocol}//${
		window.location.hostname
		}/${blobId.substring(5)}`;

		return url.split("?type=");
	}

}