(function(window, document) {
	
    // Specify the main script used to create a new PDF.JS web worker.
    PDFJS.workerSrc = '../js/pdf.min.js';

	var holder = document.getElementById('all');
	holder.ondragover = function () { return false; };
	holder.ondragend = function () { return false; };

	holder.ondrop = function(e) {		
		e.preventDefault();

		// test for FileReader support
		if(!window.FileReader) {
			alert('Sorry, your browser has no FileReader support!');
			return;
		}
		
		var reader = new window.FileReader();
		reader.onload = function(event) {
			var data = event.target.result;

			// Instantiate PDFDoc with PDF data
			var pdf = new PDFJS.PDFDoc(data);
			var numPages = pdf.numPages < 3 ? pdf.numPages : 3;
			
			// render pages
			for (var i = 1; i <= numPages; i++) {
				var page = pdf.getPage(i);
				var canvas = document.getElementById('p' + i + '-canvas');
				renderPage(page, canvas);
			}
		};
		
		// read file as ArrayBuffer for pdf.js input
		var file = e.dataTransfer.files[0];
		reader.readAsArrayBuffer(file);
	};

	function renderPage(page, canvas) {
		// Prepare canvas using PDF page dimensions
		var context = canvas.getContext('2d');
		canvas.height = canvas.parentElement.clientHeight;
		canvas.width = canvas.parentElement.clientWidth;
		// Render PDF page into canvas context
		page.startRendering(context);
	}
	
}(window, document));