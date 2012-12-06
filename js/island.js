/*
	Canvas wrapper
*/
function Canvas(target, width, height) {
	this.el = document.getElementById(target);
	this.ctx = this.el.getContext('2d');
	this.el.setAttribute('width', width);
	this.el.setAttribute('height', height);
	this.el.style.border = '1px solid #ededed';
}

Canvas.prototype.drawPoint = function(point, color) {
	var _color = color || new Color(0, 0, 50);
	color = _color.toString();

	this.ctx.fillStyle = color;
	this.ctx.beginPath();
	this.ctx.arc(point.x, point.y, 2, 0, Math.PI*2);
	this.ctx.fill();
}

Canvas.prototype.drawPoints = function(points, color) {
	var p = points.length;
	var _color = color || new Color(0, 0, 50);

	while(p--) {
		this.drawPoint(points[p], _color)
	}
}

Canvas.prototype.drawLine = function(first, last, color) {
	var _color = color || new Color(0, 0, 50);

	this.ctx.strokeStyle = _color.toString();
	this.ctx.lineWidth = 1;
	this.ctx.moveTo(first.x, first.y);
	this.ctx.lineTo(last.x, last.y);
	this.ctx.stroke();
}

Canvas.prototype.drawPolygon = function(edges) {
	var _color = color || new Color(0, 0, 50);

	this.ctx.strokeStyle = _color.toString();
	this.ctx.lineWidth = 1;
	this.ctx.moveTo(first.x, first.y);
	this.ctx.lineTo(last.x, last.y);
	this.ctx.stroke();
}

function Color(h, s, l) {
	this.h = h
	this.s = s;
	this.l = l;
}

Color.prototype.toString = function() {
	return 'hsl('+this.h+','+this.s+'%,'+this.l+'%)';
}

/*
	Geom classes
*/

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function Edge(first, last) {
	this.first = first;
	this.last = last;
}

/*
	Island Generator
*/

function Island(canvas) {
	this.canvas = canvas;
};

Island.prototype.colorCodes = {
	'ocean': new Color(223, 64, 32), 
	'land': new Color(51, 17, 80), 
	'coast':  new Color(51, 15, 91), 
}

Island.prototype.setSize = function(width, height) {
	this.width = width;
	this.height = height;
};

Island.prototype.generateSeeds = function(count, relax) {
	relax = relax || 1;
	var _count = count;
	var boundings = {xl: 0, xr: this.width, yt: 0, yb: this.height};
	var seeds = [];

	while(count --) {
		var x = Math.round(Math.random() * this.width);
		var y = Math.round(Math.random() * this.width);
		var seed = new Point(x, y);
		seeds.push(seed);
	}

	while(relax--) {
		this.diagram = new Diagram(seeds, boundings);
		seeds = this.diagram.centroids;
	}

	this.drawLand('drawCircular');
	//this.diagram.drawEdges(false, this.canvas);
	this.drawCoastLine();
	this.diagram.drawCells(this.canvas);

}

Island.prototype.drawLand = function(drawFunction) {
	drawFunction = this[drawFunction];

	for(var c = 0; c < this.diagram.cells.length; c ++) {
		var cell = this.diagram.cells[c];
		cell.type = drawFunction.call(this, cell.centroid.x, cell.centroid.y) ? 'land': 'ocean';
	}
}

Island.prototype.drawCoastLine = function() {
	for(var c = 0; c < this.diagram.cells.length; c ++) {
		var cell = this.diagram.cells[c];
		if(cell.type == 'land') {
			for(var a = 0; a < cell.adjacents.length; a ++) {
				var index = cell.adjacents[a];
				var adjacent = this.diagram.cells[index];
				if(adjacent.type == 'ocean') {
					cell.type = 'coast';
					break;
				}
			}
		}
	}
}

Island.prototype.drawCircular = function(x, y) {
	var radius = this.width * .25;
	var center = {x: this.width * .5, y: this.height * .5};
	var dx = Math.abs(x - center.x);
	var dy = Math.abs(y - center.y);
	var distance = Math.sqrt((dx * dx) + (dy * dy));
	return (distance <= radius);
}


/*
	Diagram wrapper
*/

function Diagram(seeds, boundings) {
	this.voronoi = new Voronoi();
	var data = this.voronoi.compute(seeds, boundings);
	this.cells = data.cells;
	this.edges = data.edges;
	this.centroids = [];

	for(var c = 0; c < this.cells.length; c ++) {
		this.cells[c].setArea();
		this.cells[c].setCentroid();
		this.cells[c].setAdjacents();
		this.centroids.push(this.cells[c].centroid)
	}
}

Diagram.prototype.drawEdges = function(color, canvas) {
	var e = this.edges.length;
	var _color = color || new Color(0, 0, 50);

	while(e--) {
		var edge = this.edges[e];
		var first = edge.va;
		var last = edge.vb;
		
		canvas.ctx.strokeStyle = _color.toString();
		canvas.ctx.lineWidth = 1;
		canvas.ctx.moveTo(first.x, first.y);
		canvas.ctx.lineTo(last.x, last.y);
	}

	canvas.ctx.stroke();
}

Diagram.prototype.drawCells = function(canvas) {
	for(var c = 0; c < this.cells.length; c ++) {
		var cell = this.cells[c];
		var v = cell.vertices.length;

		var _color = Island.prototype.colorCodes[cell.type] || new Color(100, 100, 50);
		canvas.ctx.fillStyle = _color.toString();
		canvas.ctx.beginPath();
		canvas.ctx.moveTo(cell.vertices[0].x, cell.vertices[0].y);
		while(v--) {
			var vertex = cell.vertices[v];
			canvas.ctx.lineTo(vertex.x, vertex.y);
		}
		canvas.ctx.closePath();
		canvas.ctx.fill();
	}
}

/*
	Voronoi extensions
*/

Voronoi.prototype.Cell.prototype.setArea = function() {
	var halfedges = this.halfedges;
    var length = halfedges.length;
	if (length > 2) {
		this.vertices = [];
		for (var j = 0; j < length; j++) {
			v = halfedges[j].getEndpoint();
			this.vertices.push(new Point(v.x, v.y));
		}

		var area = 0;
	    var j = this.vertices.length - 1;
	    var p1; var p2;

	    for (var i = 0; i < this.vertices.length; j = i++) {
	      p1 = this.vertices[i]; p2 = this.vertices[j];
	      area += p1.x * p2.y;
	      area -= p1.y * p2.x;
	    }
	    
	    area /= 2;
	    this.area = area;
	}
}

Voronoi.prototype.Cell.prototype.setCentroid = function() {
	var halfedges = this.halfedges;
    var length = halfedges.length;
	if (length > 2) {
		var x = 0; 
	    var y = 0;
	    var f;
	    var j = this.vertices.length -1;
	    var p1; var p2;

	    for (var i = 0; i < this.vertices.length; j = i++) {
	      p1 = this.vertices[i]; p2 = this.vertices[j];
	      f= p1.x * p2.y - p2.x * p1.y;
	      x += (p1.x + p2.x) * f;
	      y += (p1.y + p2.y) *f;
	    }

	    f = this.area * 6;
	    this.centroid = new Point(x/f, y/f)
	}
}

Voronoi.prototype.Cell.prototype.setAdjacents = function() {
	this.adjacents = [];
	var halfedges = this.halfedges;
    var length = halfedges.length;
	
	if (length > 2) {
		for(var h = 0; h < length; h ++) {
			var halfedge = this.halfedges[h];
			var lAdj = false, rAdj = false;
			if(halfedge.edge.lSite)
				lAdj = halfedge.edge.lSite.voronoiId;
			if(halfedge.edge.rSite)
				rAdj = halfedge.edge.rSite.voronoiId;
			var adjacent = lAdj != this.site.voronoiId ? lAdj: rAdj;
			this.adjacents.push(adjacent);
		}
	}
}