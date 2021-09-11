var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.5' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const appState = writable("home");
    const numberOfCards = writable(2);
    const currentQuestion = writable(" ");
    const pastQuestions = writable([]);

    const cardData = readable([
      {
        number: 1,
        name: "Rider",
        "meaning-1": "News",
        "meaning-2": "Messages",
        "meaning-3": "Speed"
      },

      {
        number: 2,
        name: "Clover",
        "meaning-1": "Quick luck",
        "meaning-2": "Opportunity",
        "meaning-3": "Small joys"
      },

      {
        number: 3,
        name: "Ship",
        "meaning-1": "Distance",
        "meaning-2": "Travel",
        "meaning-3": "Adventure"
      },

      {
        number: 4,
        name: "House",
        "meaning-1": "Family",
        "meaning-2": "Safety",
        "meaning-3": "Tradition"
      },

      {
        number: 5,
        name: "Tree",
        "meaning-1": "Growth",
        "meaning-2": "Health",
        "meaning-3": "Spirituality"
      },

      {
        number: 6,
        name: "Cloud",
        "meaning-1": "Chaos",
        "meaning-2": "Confusion",
        "meaning-3": "Doubt"
      },

      {
        number: 7,
        name: "Snake",
        "meaning-1": "Seduction",
        "meaning-2": "Craving",
        "meaning-3": "Desire"
      },

      {
        number: 8,
        name: "Coffin",
        "meaning-1": "Ending",
        "meaning-2": "Grief",
        "meaning-3": "Sadness"
      },

      {
        number: 9,
        name: "Bouquet",
        "meaning-1": "Happiness",
        "meaning-2": "Gift",
        "meaning-3": "Cordiality"
      },

      {
        number: 10,
        name: "Scythe",
        "meaning-1": "Sudden end",
        "meaning-2": "Accident",
        "meaning-3": "Danger"
      },

      {
        number: 11,
        name: "Whip",
        "meaning-1": "Conflit",
        "meaning-2": "Debate",
        "meaning-3": "Fight"
      },

      {
        number: 12,
        name: "Birds",
        "meaning-1": "Communication",
        "meaning-2": "Chattering",
        "meaning-3": "Gossip"
      },

      {
        number: 13,
        name: "Child",
        "meaning-1": "Beginning",
        "meaning-2": "Innocence",
        "meaning-3": "Inexperience"
      },

      {
        number: 14,
        name: "Fox",
        "meaning-1": "Trickery",
        "meaning-2": "Suspicion",
        "meaning-3": "Selfishness"
      },

      {
        number: 15,
        name: "Bear",
        "meaning-1": "Boss",
        "meaning-2": "Strong personality",
        "meaning-3": "Power"
      },

      {
        number: 16,
        name: "Star",
        "meaning-1": "Hope",
        "meaning-2": "Optimism",
        "meaning-3": "Inspiration"
      },

      {
        number: 17,
        name: "Stork",
        "meaning-1": "Change",
        "meaning-2": "Migration",
        "meaning-3": "Movement"
      },

      {
        number: 18,
        name: "Dog",
        "meaning-1": "Loyalty",
        "meaning-2": "Friendship",
        "meaning-3": "Support"
      },

      {
        number: 19,
        name: "Tower",
        "meaning-1": "Loneliness",
        "meaning-2": "Authority",
        "meaning-3": "Hierarchy"
      },

      {
        number: 20,
        name: "Garden",
        "meaning-1": "Public affairs",
        "meaning-2": "Society",
        "meaning-3": "Social networks"
      },

      {
        number: 21,
        name: "Mountain",
        "meaning-1": "Obstacles",
        "meaning-2": "Problems",
        "meaning-3": "Challenges"
      },

      {
        number: 22,
        name: "Paths",
        "meaning-1": "Choices",
        "meaning-2": "Decisions",
        "meaning-3": "Many opportunities"
      },

      {
        number: 23,
        name: "Mouse",
        "meaning-1": "Reduction",
        "meaning-2": "Destruction",
        "meaning-3": "Deficiency"
      },

      {
        number: 24,
        name: "Heart",
        "meaning-1": "Love",
        "meaning-2": "Passion",
        "meaning-3": "Romance"
      },

      {
        number: 25,
        name: "Ring",
        "meaning-1": "Commitment",
        "meaning-2": "Contract",
        "meaning-3": "Cycles"
      },

      {
        number: 26,
        name: "Book",
        "meaning-1": "Secrets",
        "meaning-2": "Knowledge",
        "meaning-3": "Study"
      },

      {
        number: 27,
        name: "Letter",
        "meaning-1": "Document",
        "meaning-2": "Written communication",
        "meaning-3": "Email"
      },

      {
        number: 28,
        name: "Gentleman",
        "meaning-1": "A man",
        "meaning-2": "Masculinity",
        "meaning-3": "Male energies"
      },

      {
        number: 29,
        name: "Lady",
        "meaning-1": "A woman",
        "meaning-2": "Femininity",
        "meaning-3": "Female energies"
      },

      {
        number: 30,
        name: "Lily",
        "meaning-1": "Purity",
        "meaning-2": "Sensuality",
        "meaning-3": "Morality"
      },

      {
        number: 31,
        name: "Sun",
        "meaning-1": "Plenitude",
        "meaning-2": "Happiness",
        "meaning-3": "Victory"
      },

      {
        number: 32,
        name: "Moon",
        "meaning-1": "Subconscious",
        "meaning-2": "Intuition",
        "meaning-3": "Emotions"
      },

      {
        number: 33,
        name: "Key",
        "meaning-1": "Important",
        "meaning-2": "Unlocking",
        "meaning-3": "Achievement"
      },

      {
        number: 34,
        name: "Fish",
        "meaning-1": "Abundance",
        "meaning-2": "Wealth",
        "meaning-3": "Finances"
      },

      {
        number: 35,
        name: "Anchor",
        "meaning-1": "Stability",
        "meaning-2": "Security",
        "meaning-3": "Resilience"
      },

      {
        number: 36,
        name: "Cross",
        "meaning-1": "Karma",
        "meaning-2": "Burden",
        "meaning-3": "Duty"
      }
    ]);

    /* components\Card.svelte generated by Svelte v3.42.5 */

    const file = "components\\Card.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div4;
    	let div0;
    	let p0;
    	let t0_value = /*cardData*/ ctx[0]['number'] + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = /*cardData*/ ctx[0]['name'] + "";
    	let t2;
    	let t3;
    	let img;
    	let img_src_value;
    	let t4;
    	let div1;
    	let p2;
    	let t5_value = /*cardData*/ ctx[0]['meaning-1'] + "";
    	let t5;
    	let t6;
    	let div2;
    	let p3;
    	let t7_value = /*cardData*/ ctx[0]['meaning-2'] + "";
    	let t7;
    	let t8;
    	let div3;
    	let p4;
    	let t9_value = /*cardData*/ ctx[0]['meaning-3'] + "";
    	let t9;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			img = element("img");
    			t4 = space();
    			div1 = element("div");
    			p2 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			div2 = element("div");
    			p3 = element("p");
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			p4 = element("p");
    			t9 = text(t9_value);
    			attr_dev(p0, "class", "card-number svelte-q70dyl");
    			add_location(p0, file, 69, 6, 1273);
    			attr_dev(p1, "class", "card-name svelte-q70dyl");
    			add_location(p1, file, 70, 6, 1330);
    			attr_dev(img, "class", "card-image svelte-q70dyl");
    			if (!src_url_equal(img.src, img_src_value = /*cardImagePath*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Girl in a jacket");
    			add_location(img, file, 71, 6, 1383);
    			attr_dev(div0, "class", "card-container svelte-q70dyl");
    			add_location(div0, file, 68, 4, 1237);
    			attr_dev(p2, "class", "meaning-1 svelte-q70dyl");
    			add_location(p2, file, 75, 6, 1513);
    			attr_dev(div1, "class", "meaning-1-container svelte-q70dyl");
    			add_location(div1, file, 74, 4, 1472);
    			attr_dev(p3, "class", "meaning-2 svelte-q70dyl");
    			add_location(p3, file, 78, 6, 1622);
    			attr_dev(div2, "class", "meaning-2-container svelte-q70dyl");
    			add_location(div2, file, 77, 4, 1581);
    			attr_dev(p4, "class", "meaning-3 svelte-q70dyl");
    			add_location(p4, file, 81, 6, 1731);
    			attr_dev(div3, "class", "meaning-3-container svelte-q70dyl");
    			add_location(div3, file, 80, 4, 1690);
    			attr_dev(div4, "class", "outter-card-container svelte-q70dyl");
    			add_location(div4, file, 67, 2, 1196);
    			attr_dev(main, "class", "svelte-q70dyl");
    			add_location(main, file, 66, 0, 1186);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, img);
    			append_dev(div4, t4);
    			append_dev(div4, div1);
    			append_dev(div1, p2);
    			append_dev(p2, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div2);
    			append_dev(div2, p3);
    			append_dev(p3, t7);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, p4);
    			append_dev(p4, t9);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cardData*/ 1 && t0_value !== (t0_value = /*cardData*/ ctx[0]['number'] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*cardData*/ 1 && t2_value !== (t2_value = /*cardData*/ ctx[0]['name'] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*cardData*/ 1 && t5_value !== (t5_value = /*cardData*/ ctx[0]['meaning-1'] + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*cardData*/ 1 && t7_value !== (t7_value = /*cardData*/ ctx[0]['meaning-2'] + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*cardData*/ 1 && t9_value !== (t9_value = /*cardData*/ ctx[0]['meaning-3'] + "")) set_data_dev(t9, t9_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, []);
    	let { cardData } = $$props;
    	const cardImagePath = "./" + cardData["name"].toLowerCase() + ".png";
    	const writable_props = ['cardData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('cardData' in $$props) $$invalidate(0, cardData = $$props.cardData);
    	};

    	$$self.$capture_state = () => ({ cardData, cardImagePath });

    	$$self.$inject_state = $$props => {
    		if ('cardData' in $$props) $$invalidate(0, cardData = $$props.cardData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cardData, cardImagePath];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { cardData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cardData*/ ctx[0] === undefined && !('cardData' in props)) {
    			console.warn("<Card> was created without expected prop 'cardData'");
    		}
    	}

    	get cardData() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardData(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* views\Home.svelte generated by Svelte v3.42.5 */
    const file$1 = "views\\Home.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (72:6) {#each question.cards as card}
    function create_each_block_1(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				cardData: /*$cardData*/ ctx[2][/*card*/ ctx[10]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*$cardData, $pastQuestions*/ 6) card_changes.cardData = /*$cardData*/ ctx[2][/*card*/ ctx[10]];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(72:6) {#each question.cards as card}",
    		ctx
    	});

    	return block;
    }

    // (69:2) {#each $pastQuestions as question}
    function create_each_block(ctx) {
    	let p;
    	let t0_value = /*question*/ ctx[7].question + "";
    	let t0;
    	let t1;
    	let div;
    	let t2;
    	let current;
    	let each_value_1 = /*question*/ ctx[7].cards;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(p, file$1, 69, 4, 1675);
    			attr_dev(div, "class", "tutorial-cards-container svelte-1x4zms1");
    			add_location(div, file$1, 70, 4, 1708);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$pastQuestions*/ 2) && t0_value !== (t0_value = /*question*/ ctx[7].question + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$cardData, $pastQuestions*/ 6) {
    				each_value_1 = /*question*/ ctx[7].cards;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t2);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(69:2) {#each $pastQuestions as question}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let input;
    	let input_placeholder_value;
    	let t4;
    	let p1;
    	let t6;
    	let button0;
    	let t8;
    	let button1;
    	let t10;
    	let h2;
    	let t12;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*$pastQuestions*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Lenormand";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Think about what you want to ask";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Choose the type of reading...";
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Read simple question";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Read past, present, future";
    			t10 = space();
    			h2 = element("h2");
    			h2.textContent = "Past questions";
    			t12 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$1, 59, 1, 1169);
    			add_location(p0, file$1, 60, 2, 1191);
    			attr_dev(input, "class", "main-input svelte-1x4zms1");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", input_placeholder_value = 'Write your question here');
    			add_location(input, file$1, 61, 2, 1236);
    			add_location(p1, file$1, 63, 2, 1348);
    			attr_dev(button0, "class", "main-button svelte-1x4zms1");
    			add_location(button0, file$1, 64, 2, 1390);
    			attr_dev(button1, "class", "main-button svelte-1x4zms1");
    			add_location(button1, file$1, 65, 2, 1495);
    			add_location(h2, file$1, 67, 2, 1608);
    			attr_dev(main, "class", "outter-container svelte-1x4zms1");
    			add_location(main, file$1, 58, 0, 1135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(main, t3);
    			append_dev(main, input);
    			set_input_value(input, /*inputText*/ ctx[0]);
    			append_dev(main, t4);
    			append_dev(main, p1);
    			append_dev(main, t6);
    			append_dev(main, button0);
    			append_dev(main, t8);
    			append_dev(main, button1);
    			append_dev(main, t10);
    			append_dev(main, h2);
    			append_dev(main, t12);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*inputText*/ 1 && input.value !== /*inputText*/ ctx[0]) {
    				set_input_value(input, /*inputText*/ ctx[0]);
    			}

    			if (dirty & /*$pastQuestions, $cardData*/ 6) {
    				each_value = /*$pastQuestions*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $pastQuestions;
    	let $cardData;
    	validate_store(pastQuestions, 'pastQuestions');
    	component_subscribe($$self, pastQuestions, $$value => $$invalidate(1, $pastQuestions = $$value));
    	validate_store(cardData, 'cardData');
    	component_subscribe($$self, cardData, $$value => $$invalidate(2, $cardData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);

    	const startReading = (number, question) => {
    		appState.set("reading");
    		numberOfCards.set(number);
    		currentQuestion.set(question);
    	};

    	let inputText = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		inputText = this.value;
    		$$invalidate(0, inputText);
    	}

    	const click_handler = () => startReading(2, inputText);
    	const click_handler_1 = () => startReading(6, inputText);

    	$$self.$capture_state = () => ({
    		appState,
    		numberOfCards,
    		currentQuestion,
    		pastQuestions,
    		cardData,
    		Card,
    		startReading,
    		inputText,
    		$pastQuestions,
    		$cardData
    	});

    	$$self.$inject_state = $$props => {
    		if ('inputText' in $$props) $$invalidate(0, inputText = $$props.inputText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		inputText,
    		$pastQuestions,
    		$cardData,
    		startReading,
    		input_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* views\Reading.svelte generated by Svelte v3.42.5 */
    const file$2 = "views\\Reading.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (85:4) {#each drawnCards as card}
    function create_each_block$1(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				cardData: /*$cardData*/ ctx[1][/*card*/ ctx[9]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*$cardData*/ 2) card_changes.cardData = /*$cardData*/ ctx[1][/*card*/ ctx[9]];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(85:4) {#each drawnCards as card}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let button;
    	let t4;
    	let h2;
    	let t6;
    	let p0;
    	let t7;
    	let br0;
    	let t8;
    	let br1;
    	let t9;
    	let t10;
    	let p1;
    	let t12;
    	let div1;
    	let card0;
    	let t13;
    	let card1;
    	let t14;
    	let p2;
    	let t15;
    	let br2;
    	let t16;
    	let br3;
    	let t17;
    	let t18;
    	let p3;
    	let t19;
    	let br4;
    	let t20;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*drawnCards*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	card0 = new Card({
    			props: { cardData: /*$cardData*/ ctx[1][11] },
    			$$inline: true
    		});

    	card1 = new Card({
    			props: { cardData: /*$cardData*/ ctx[1][12] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text(/*$currentQuestion*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Go back";
    			t4 = space();
    			h2 = element("h2");
    			h2.textContent = "HOW TO READ";
    			t6 = space();
    			p0 = element("p");
    			t7 = text("Read the cards in pairs. ");
    			br0 = element("br");
    			t8 = text(" \r\n  The first card acts as a noun. ");
    			br1 = element("br");
    			t9 = text(" \r\n  The second card acts as an adjective.");
    			t10 = space();
    			p1 = element("p");
    			p1.textContent = "For example:";
    			t12 = space();
    			div1 = element("div");
    			create_component(card0.$$.fragment);
    			t13 = space();
    			create_component(card1.$$.fragment);
    			t14 = space();
    			p2 = element("p");
    			t15 = text("Inocent communication ");
    			br2 = element("br");
    			t16 = text("\r\n  Beginning of gossiping ");
    			br3 = element("br");
    			t17 = text("\r\n  Inexperienced speech");
    			t18 = space();
    			p3 = element("p");
    			t19 = text("Cards may have multiple meanings. ");
    			br4 = element("br");
    			t20 = text(" Interpret them according to your context.");
    			add_location(h1, file$2, 82, 1, 1661);
    			attr_dev(div0, "class", "cards-container svelte-1v1g7v7");
    			add_location(div0, file$2, 83, 2, 1692);
    			attr_dev(button, "class", "main-button svelte-1v1g7v7");
    			add_location(button, file$2, 88, 2, 1822);
    			attr_dev(h2, "class", "tutorial-header svelte-1v1g7v7");
    			add_location(h2, file$2, 90, 2, 1905);
    			add_location(br0, file$2, 91, 31, 1984);
    			add_location(br1, file$2, 92, 33, 2024);
    			add_location(p0, file$2, 91, 2, 1955);
    			add_location(p1, file$2, 94, 2, 2078);
    			attr_dev(div1, "class", "tutorial-cards-container svelte-1v1g7v7");
    			add_location(div1, file$2, 95, 2, 2103);
    			add_location(br2, file$2, 99, 28, 2257);
    			add_location(br3, file$2, 100, 25, 2288);
    			add_location(p2, file$2, 99, 2, 2231);
    			add_location(br4, file$2, 103, 40, 2364);
    			add_location(p3, file$2, 103, 2, 2326);
    			attr_dev(main, "class", "outter-container svelte-1v1g7v7");
    			add_location(main, file$2, 81, 0, 1627);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(main, t1);
    			append_dev(main, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(main, t2);
    			append_dev(main, button);
    			append_dev(main, t4);
    			append_dev(main, h2);
    			append_dev(main, t6);
    			append_dev(main, p0);
    			append_dev(p0, t7);
    			append_dev(p0, br0);
    			append_dev(p0, t8);
    			append_dev(p0, br1);
    			append_dev(p0, t9);
    			append_dev(main, t10);
    			append_dev(main, p1);
    			append_dev(main, t12);
    			append_dev(main, div1);
    			mount_component(card0, div1, null);
    			append_dev(div1, t13);
    			mount_component(card1, div1, null);
    			append_dev(main, t14);
    			append_dev(main, p2);
    			append_dev(p2, t15);
    			append_dev(p2, br2);
    			append_dev(p2, t16);
    			append_dev(p2, br3);
    			append_dev(p2, t17);
    			append_dev(main, t18);
    			append_dev(main, p3);
    			append_dev(p3, t19);
    			append_dev(p3, br4);
    			append_dev(p3, t20);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$currentQuestion*/ 1) set_data_dev(t0, /*$currentQuestion*/ ctx[0]);

    			if (dirty & /*$cardData, drawnCards*/ 10) {
    				each_value = /*drawnCards*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const card0_changes = {};
    			if (dirty & /*$cardData*/ 2) card0_changes.cardData = /*$cardData*/ ctx[1][11];
    			card0.$set(card0_changes);
    			const card1_changes = {};
    			if (dirty & /*$cardData*/ 2) card1_changes.cardData = /*$cardData*/ ctx[1][12];
    			card1.$set(card1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			destroy_component(card0);
    			destroy_component(card1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $numberOfCards;
    	let $currentQuestion;
    	let $pastQuestions;
    	let $cardData;
    	validate_store(numberOfCards, 'numberOfCards');
    	component_subscribe($$self, numberOfCards, $$value => $$invalidate(5, $numberOfCards = $$value));
    	validate_store(currentQuestion, 'currentQuestion');
    	component_subscribe($$self, currentQuestion, $$value => $$invalidate(0, $currentQuestion = $$value));
    	validate_store(pastQuestions, 'pastQuestions');
    	component_subscribe($$self, pastQuestions, $$value => $$invalidate(6, $pastQuestions = $$value));
    	validate_store(cardData, 'cardData');
    	component_subscribe($$self, cardData, $$value => $$invalidate(1, $cardData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Reading', slots, []);

    	const addCurrentQuestionToPastQuestion = () => {
    		set_store_value(
    			pastQuestions,
    			$pastQuestions = [
    				...$pastQuestions,
    				{
    					question: $currentQuestion,
    					cards: drawnCards
    				}
    			],
    			$pastQuestions
    		);
    	};

    	const stopReading = () => {
    		appState.set("home");
    		addCurrentQuestionToPastQuestion();
    	};

    	const drawCard = cardsArray => {
    		const newNumber = Math.floor(Math.random() * 35);

    		const newNumberIsRepeated = cardsArray.find(cardNumber => {
    		});

    		if (newNumberIsRepeated) {
    			drawCard(cardsArray);
    		} else {
    			return newNumber;
    		}
    	};

    	let drawnCards = [];

    	for (let i = 0; i < $numberOfCards; i++) {
    		drawnCards.push(drawCard(drawnCards));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Reading> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => stopReading();

    	$$self.$capture_state = () => ({
    		appState,
    		cardData,
    		numberOfCards,
    		currentQuestion,
    		pastQuestions,
    		Card,
    		addCurrentQuestionToPastQuestion,
    		stopReading,
    		drawCard,
    		drawnCards,
    		$numberOfCards,
    		$currentQuestion,
    		$pastQuestions,
    		$cardData
    	});

    	$$self.$inject_state = $$props => {
    		if ('drawnCards' in $$props) $$invalidate(3, drawnCards = $$props.drawnCards);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$currentQuestion, $cardData, stopReading, drawnCards, click_handler];
    }

    class Reading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reading",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* App.svelte generated by Svelte v3.42.5 */
    const file$3 = "App.svelte";

    // (18:35) 
    function create_if_block_1(ctx) {
    	let reading;
    	let current;
    	reading = new Reading({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(reading.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(reading, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(reading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(reading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(reading, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(18:35) ",
    		ctx
    	});

    	return block;
    }

    // (16:2) {#if $appState == 'home'}
    function create_if_block(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:2) {#if $appState == 'home'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$appState*/ ctx[0] == 'home') return 0;
    		if (/*$appState*/ ctx[0] == 'reading') return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-1na4wt1");
    			add_location(main, file$3, 14, 0, 237);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $appState;
    	validate_store(appState, 'appState');
    	component_subscribe($$self, appState, $$value => $$invalidate(0, $appState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Home, Reading, appState, $appState });
    	return [$appState];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
