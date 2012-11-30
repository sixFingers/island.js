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
	this.seeds = [];
};

Island.prototype.setSize = function(width, height) {
	this.width = width;
	this.height = height;
};

Island.prototype.generateSeeds = function(count, relax) {
	relax = relax || 1;
	var _count = count;
	var boundings = {xl: 0, xr: this.width, yt: 0, yb: this.height};
	var diagram;

	while(count --) {
		var x = Math.round(Math.random() * this.width);
		var y = Math.round(Math.random() * this.width);
		var seed = new Point(x, y);
		this.seeds.push(seed);
	}

	while(relax--) {
		diagram = new Diagram(this.seeds, boundings);
		this.seeds = diagram.centroids;
	}

	diagram.drawEdges(false, this.canvas);
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

/*
	Voronoi extensions
*/

Voronoi.prototype.Cell.prototype.setArea = function() {
	var halfedges = this.halfedges;
    var length = halfedges.length;
	if (length > 2) {
		var vertices = [];
		for (var j = 0; j < length; j++) {
			v = halfedges[j].getEndpoint();
			vertices.push(new Point(v.x, v.y));
		}

		var area = 0;
	    var j = vertices.length - 1;
	    var p1; var p2;

	    for (var i = 0; i < vertices.length; j = i++) {
	      p1 = vertices[i]; p2 = vertices[j];
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
		var vertices = [];
		for (var j = 0; j < length; j++) {
			v = halfedges[j].getEndpoint();
			vertices.push(new Point(v.x, v.y));
		}

		var x = 0; 
	    var y = 0;
	    var f;
	    var j = vertices.length -1;
	    var p1; var p2;

	    for (var i = 0; i < vertices.length; j = i++) {
	      p1 = vertices[i]; p2 = vertices[j];
	      f= p1.x * p2.y - p2.x * p1.y;
	      x += (p1.x + p2.x) * f;
	      y += (p1.y + p2.y) *f;
	    }

	    f = this.area * 6;
	    this.centroid = new Point(x/f, y/f)
	}
}
