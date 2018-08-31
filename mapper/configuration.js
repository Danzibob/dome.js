class Controller {
	constructor(id){
		// ID of this controller; links to IP address
		this.id = id
		// Ordered list of vertex IDs on controller's path
		this._nodeList = []
		// Ordered list of struts on controller's path
		this._struts = []

		this._highlighted = false
	}

	addNode(id){
		// Add a new node onto the end of this string
		let l = this._nodeList.length
		if(l > 0){
			let strut
			try { 
				strut = dome.getStrutByVerts(id, this._nodeList[l-1])
				if(this._struts[this._struts.length - 1] === strut){
					console.log("That's the same strut, silly")
					return
				}
			} catch (ex){
				console.log("Can't add that node!")
				return
			}
			this._nodeList.push(id)
			this._struts.push(strut)
			strut.covered = true
			if(this._highlighted !== false){
				strut.color = this._highlighted
			}
		} else {
			this._nodeList.push(id)
		}
	}

	setStrutColors(color = 0xffffff){
		this._struts.forEach(s => s.color = color)
		this._highlighted = color
	}
	
	clearStrutColors(){
		this._struts.forEach(s => s.resetColor())
		this._highlighted = false
	}

	get numLeds(){
		let sum = 0
		this._struts.forEach(s => sum += s.numLeds)
		return sum
	}
	get ledPositions(){
		let positions = []
		for(let i = 0; i < this._struts.length; i++){
			positions.push(...this._struts[i].ledPositions)
		}
		return positions
	}
}

class Configurator {
	constructor(){
		this.controllers = []
		for(let i=0; i < 5; i++) this.addController()
		this.currentController = 0
		this.symmetry = true
		gui.add(this, 'symmetry').name('Symmetry')
		gui.add(this, "addController")
		gui.add(this, "export")
	}

	addController(){
		let id = this.controllers.length
		this.controllers.push(new Controller(id))
		$("#controllers").append("<div class='controller' id='Con"+id+"'>"+id+"</div>")
		this.currentController = id
		if(this.symmetry){ 
			for(let i=1; i < 5; i++){
				this.controllers.push(new Controller(id+i))
				$("#controllers").append("<div class='controller' id='Con"+(id+i)+"'>"+(id+i)+"</div>")
			}
		}
	}

	addNode(id){
		this.controllers[this.currentController].addNode(id)
		if(this.symmetry){
			for(let i = 1; i < 5; i++){
				let nodeID = dome.getVertByRotation(id,i)
				this.controllers[this.currentController + i].addNode(nodeID)
			}
		}
	}

	highlight(ids){
		console.log
		this.controllers.forEach(c => c.clearStrutColors())
		ids.forEach(id => this.controllers[id].setStrutColors())
	}

	export(){
		var vID = 0
		let Verts = dome._verts.map(function (v){
			let vertObj = {
				id: vID,
				pos: [v.x,v.y,v.z],
				neighbors: dome.getNeighbors(vID)
			}
			vID++
			return vertObj
		})
		var sID = 0
		let Struts = dome._edges.map(function (e){
			let strutObj = {
				id: e,
				num_leds: dome._struts[sID].numLeds,
			}
			sID++
			return strutObj
		})
		let config = {
			Controllers: [],
			Verts,
			Struts,
			led_list: []
		}
		for(let i = 0; i < this.controllers.length; i++){
			let C = this.controllers[i]
			config.Controllers.push({
				id: i,
				num_leds: C.numLeds,
				start_index: config.led_list.length,
				verts: C._nodeList
			})
			console.log(C.ledPositions.length)
			config.led_list.push(...C.ledPositions)
		}
		$("#output textarea").val(JSON.stringify(config, null, 2))
		$("#output").show()
		return config
	}

	get currentController(){
		return this._currentController
	}
	set currentController(id){
		this.highlight([id])
		this._currentController = id
		$("#controller").html(id)
	}
}

// {
//     Controllers:[
//         { id: <id>, num_leds: <num>, start_index: <index>, [ip: <ip>], verts: [<id>,<id>,...]}
//         ...
//     ],
//     Verts:[
//     	{ id: <id>, pos: [x,y,z], neighbors: [<id>,<id>,...]}
//     ],
//     Struts:[
//     	{ id: <[vID,vID]>, num_leds: <n>}
//     ]
//     led_list: [[x,y,z],[x,y,z] ... list all 10.5k]
// }
