$(document).ready(function () {
	$('#num-children-submit').click(function() {
		var counter = 0;
		var numChildren = $('#num-children-input').val();

		var row = document.createElement('div');		
			row.className = 'row row-centered';
			row.id = 'child-img';
		for (i=0; i<numChildren; i++) {

			var child = document.createElement('div');
			child.id = 'child'+i;
			child.className = 'col-xs-4 col-centered';

			var childLink = document.createElement('a');
			childLink.href = 'https://amgg.org/donacion/index.php?nino='+i;

			var childImg = document.createElement('img');
			childImg.className = 'img-responsive center-block';
			childImg.src = 'image/nino-2.png';

			childLink.appendChild(childImg);
			child.appendChild(childLink);
			row.appendChild(child);

			var footer = document.getElementById("Footer");
			document.body.insertBefore(row, footer);
		}
	});
});