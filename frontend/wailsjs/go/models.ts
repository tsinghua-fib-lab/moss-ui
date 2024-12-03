export namespace main {
	
	export class FrontendCar {
	    id: number;
	    t: number;
	    x: number;
	    y: number;
	    laneId: number;
	    direction: number;
	    v: number;
	    model: string;
	
	    static createFrom(source: any = {}) {
	        return new FrontendCar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.t = source["t"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.laneId = source["laneId"];
	        this.direction = source["direction"];
	        this.v = source["v"];
	        this.model = source["model"];
	    }
	}
	export class FrontendCarFrame {
	    t: number;
	    data: FrontendCar[];
	
	    static createFrom(source: any = {}) {
	        return new FrontendCarFrame(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.t = source["t"];
	        this.data = this.convertValues(source["data"], FrontendCar);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FetchCarReturn {
	    data: FrontendCarFrame[];
	    err: string;
	
	    static createFrom(source: any = {}) {
	        return new FetchCarReturn(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.data = this.convertValues(source["data"], FrontendCarFrame);
	        this.err = source["err"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FrontendPedestrian {
	    id: number;
	    t: number;
	    x: number;
	    y: number;
	    parentId: number;
	    direction: number;
	    v: number;
	
	    static createFrom(source: any = {}) {
	        return new FrontendPedestrian(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.t = source["t"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.parentId = source["parentId"];
	        this.direction = source["direction"];
	        this.v = source["v"];
	    }
	}
	export class FrontendPedestrianFrame {
	    t: number;
	    data: FrontendPedestrian[];
	
	    static createFrom(source: any = {}) {
	        return new FrontendPedestrianFrame(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.t = source["t"];
	        this.data = this.convertValues(source["data"], FrontendPedestrian);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FetchPedReturn {
	    data: FrontendPedestrianFrame[];
	    err: string;
	
	    static createFrom(source: any = {}) {
	        return new FetchPedReturn(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.data = this.convertValues(source["data"], FrontendPedestrianFrame);
	        this.err = source["err"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FrontendTL {
	    id: number;
	    t: number;
	    state: number;
	
	    static createFrom(source: any = {}) {
	        return new FrontendTL(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.t = source["t"];
	        this.state = source["state"];
	    }
	}
	export class FrontendTLFrame {
	    t: number;
	    data: FrontendTL[];
	
	    static createFrom(source: any = {}) {
	        return new FrontendTLFrame(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.t = source["t"];
	        this.data = this.convertValues(source["data"], FrontendTL);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FetchTLReturn {
	    data: FrontendTLFrame[];
	    err: string;
	
	    static createFrom(source: any = {}) {
	        return new FetchTLReturn(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.data = this.convertValues(source["data"], FrontendTLFrame);
	        this.err = source["err"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Sim {
	    name: string;
	    start: number;
	    steps: number;
	    map_base64: string;
	
	    static createFrom(source: any = {}) {
	        return new Sim(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.start = source["start"];
	        this.steps = source["steps"];
	        this.map_base64 = source["map_base64"];
	    }
	}
	export class LoadReturn {
	    sim?: Sim;
	    err: string;
	
	    static createFrom(source: any = {}) {
	        return new LoadReturn(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sim = this.convertValues(source["sim"], Sim);
	        this.err = source["err"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

