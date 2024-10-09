export default {
	async aggiornaTable() {
		try {
			// Attendi il caricamento dei dati da 'getConteggiTotaliDetermina'
			let dati = await getConteggiTotaliDetermina.data;
		

			// Esegui 'getAllPagamentiDisDet' e attendi il completamento
			await getAllPagamentiDisDet.run();

			// Se arriva qui, significa che 'getAllPagamentiDisDet' ha avuto successo
			showAlert('Dati caricati con successo', "success");
		} catch (error) {
			// Se c'è un errore durante l'esecuzione della query, lo gestiamo qui
			showAlert('Errore durante la richiesta dei dati', 'error');
		}
	}
}