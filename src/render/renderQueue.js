///@INFO: BASE
//RenderQueue is in charge of storing the RenderInstances that must be rendered
//There could be several RenderQueue (for opaque, transparent, overlays, etc)
//It works similar to the one in Unity
function RenderQueue( value, sort_mode, options )
{
	//container for all instances that belong to this render queue
	this.instances = [];

	this.value = value || 0;
	this.sort_mode = sort_mode || LS.RenderQueue.NO_SORT;
	this.range_start = 0;
	this.range_end = 9;
	this.must_clone_buffers = false; //used for readback rendering like refracion
	//this.visible_in_pass = null;

	//callbacks
	this.onStart = null;
	this.onFinish = null;

	//configure
	if(options)
		for(var i in options)
			this[i] = options[i];
}

RenderQueue.readback_allowed = true;

RenderQueue.prototype.sort = function()
{
	if(!this.instances.length)
		return;

	var func = null;
	switch(this.sort_mode)
	{
		case 1: func = LS.RenderQueue.sort_near_to_far_func; break;
		case 2: func = LS.RenderQueue.sort_far_to_near_func; break;
		case 3: func = LS.RenderQueue.sort_by_priority_func; break;
	}

	if(func)
		this.instances.sort( func );
}

RenderQueue.prototype.add = function( ri )
{
	this.instances.push( ri );
}

RenderQueue.prototype.clear = function()
{
	this.instances.length = 0;
}

RenderQueue.prototype.start = function( pass, render_settings )
{
	if(this.onStart)
	{
		var r = this.onStart( pass, render_settings); //cancels rendering
		if (r === false)
			return false;
	}

	if(this.instances.length && this.must_clone_buffers && RenderQueue.readback_allowed && pass === LS.COLOR_PASS )
	{
		if( LS.RenderFrameContext.current )
			LS.RenderFrameContext.current.cloneBuffers();
		//cubemaps are not cloned... too much work
	}
}

//not used...
RenderQueue.prototype.finish = function( pass )
{
	if(this.onFinish)
		this.onFinish( pass, render_settings );
}


//we use 5 so from 0 to 9 is one queue, from 10 to 19 another one, etc
RenderQueue.AUTO =			-1;
RenderQueue.BACKGROUND =	5;
RenderQueue.GEOMETRY =		15;
RenderQueue.TRANSPARENT =	25;
RenderQueue.READBACK_COLOR = 35;
RenderQueue.OVERLAY =		45;

RenderQueue.NO_SORT = 0;
RenderQueue.SORT_NEAR_TO_FAR = 1;
RenderQueue.SORT_FAR_TO_NEAR = 2;
RenderQueue.SORT_BY_PRIORITY = 3;

RenderQueue.sort_far_to_near_func = function(a,b) { return b._dist - a._dist; },
RenderQueue.sort_near_to_far_func = function(a,b) { return a._dist - b._dist; },
RenderQueue.sort_by_priority_func = function(a,b) { return b.priority - a.priority; },
RenderQueue.sort_by_priority_and_near_to_far_func = function(a,b) { var r = b.priority - a.priority; return r ? r : (a._dist - b._dist) },
RenderQueue.sort_by_priority_and_far_to_near_func = function(a,b) { var r = b.priority - a.priority; return r ? r : (b._dist - a._dist) },

LS.RenderQueue = RenderQueue;