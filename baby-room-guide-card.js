class BabyRoomGuideCard extends HTMLElement {
  constructor() {
    super();
    this._currentTemp = null;
    this._previewTemp = null;
    this._isDragging = false;
    this._eventsBound = false;
    this._userToggledView = null;
  }

  // Tells Home Assistant which component to load for the visual UI editor
  static getConfigElement() {
    return document.createElement("baby-room-guide-card-editor");
  }

  // Provides the default configuration when the card is first added to a dashboard
  static getStubConfig() {
    return {
      entity: "",
      show_full_guide: false,
      show_slider: true,
      user_toggle_full_view: true,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.config) return;

    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];

    if (!stateObj) {
      if (!this.content) this._setupContainer();
      this.content.innerHTML = `
        <ha-card>
          <div style="padding: 16px; color: red; font-family: sans-serif;">
            Please select a valid temperature entity in the visual editor.
          </div>
        </ha-card>
      `;
      return;
    }

    const newTemp = parseFloat(stateObj.state);
    if (!isNaN(newTemp) && newTemp !== this._currentTemp) {
      this._currentTemp = newTemp;

      if (!this._isDragging) {
        this.render();
      }
    }
  }

  setConfig(config) {
    if (this.config && this.config.show_full_guide !== config.show_full_guide) {
      this._userToggledView = null;
    }
    this.config = config;
    if (this._hass) this.render();
  }

  getCardSize() {
    const showFullGuide =
      this._userToggledView !== null
        ? this._userToggledView
        : this.config && this.config.show_full_guide;
    return showFullGuide ? 8 : 3;
  }

  _setupContainer() {
    const card = document.createElement("ha-card");
    this.content = document.createElement("div");
    card.appendChild(this.content);
    this.appendChild(card);
  }

  // --- INTERACTION LOGIC ---

  onPointerDown(e) {
    const slider = e.target.closest("#temp-slider-container");
    const showSlider = this.config.show_slider !== false;
    const showFullGuide =
      this._userToggledView !== null
        ? this._userToggledView
        : this.config.show_full_guide || false;

    if (slider && !showFullGuide && showSlider) {
      e.preventDefault();
      this._isDragging = true;
      this.sliderTrack = this.content.querySelector("#temp-slider-line");

      this.updateSliderPreview(e.clientY);

      this._boundMove = this.onPointerMove.bind(this);
      this._boundUp = this.onPointerUp.bind(this);
      document.addEventListener("pointermove", this._boundMove, {
        passive: false,
      });
      document.addEventListener("pointerup", this._boundUp);
      document.addEventListener("pointercancel", this._boundUp);
    }
  }

  onPointerMove(e) {
    if (!this._isDragging || !this.sliderTrack) return;
    e.preventDefault();
    this.updateSliderPreview(e.clientY);
  }

  onPointerUp(e) {
    this._isDragging = false;
    document.removeEventListener("pointermove", this._boundMove);
    document.removeEventListener("pointerup", this._boundUp);
    document.removeEventListener("pointercancel", this._boundUp);
  }

  onClick(e) {
    const resetBtn = e.target.closest("#reset-btn");
    if (resetBtn) {
      this._previewTemp = null;
      this.render();
      return;
    }

    const toggleViewBtn = e.target.closest("#toggle-view-btn");
    if (toggleViewBtn) {
      const currentFullView =
        this._userToggledView !== null
          ? this._userToggledView
          : this.config.show_full_guide || false;
      this._userToggledView = !currentFullView;
      this.render();
    }
  }

  updateSliderPreview(clientY) {
    const rect = this.sliderTrack.getBoundingClientRect();
    let y = clientY - rect.top;
    let percent = Math.max(0, Math.min(1, y / rect.height));
    let rawTemp = 28 - percent * 14;
    let roundedTemp = Math.round(rawTemp * 2) / 2;

    if (this._previewTemp !== roundedTemp) {
      this._previewTemp = roundedTemp;
      this.render();

      if (this._isDragging) {
        this.sliderTrack = this.content.querySelector("#temp-slider-line");
      }
    }
  }

  // --- RENDER LOGIC ---

  render() {
    if (!this.content) this._setupContainer();
    if (this._currentTemp === null) return;

    const showFullGuide =
      this._userToggledView !== null
        ? this._userToggledView
        : this.config.show_full_guide || false;
    const showSlider = this.config.show_slider !== false;
    const allowUserToggle = this.config.user_toggle_full_view !== false;

    const viewModeClass = showFullGuide ? "full-view" : "small-view";
    const sliderClass = showSlider ? "has-slider" : "no-slider";

    let actualDisplayTemp = Math.round(this._currentTemp);
    if (actualDisplayTemp > 28) actualDisplayTemp = 28;
    if (actualDisplayTemp < 14) actualDisplayTemp = 14;

    let activeTemp = this._currentTemp;
    let isPreviewing = false;

    if (
      !showFullGuide &&
      showSlider &&
      this._previewTemp !== null &&
      this._previewTemp !== actualDisplayTemp
    ) {
      activeTemp = Math.max(14, Math.min(28, this._previewTemp));
      isPreviewing = true;
    }

    const isLocal =
      window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const basePath = isLocal
      ? "./images"
      : "/hacsfiles/baby-room-guide-card/images";

    const imgNappy = `<img src="${basePath}/NAPPY.png" class="item-img" />`;
    const imgSleevelessVest = `<img src="${basePath}/SLEEVELESS-VEST.png" class="item-img" />`;
    const imgShortVest = `<img src="${basePath}/SHORT-SLEEVE-VEST.png" class="item-img" />`;
    const imgLongVest = `<img src="${basePath}/LONG-SLEEVE-VEST.png" class="item-img" />`;
    const imgSleepSuit = `<img src="${basePath}/SLEEP-SUIT.png" class="item-img" />`;

    const getBagHtml = (togValue) => `
      <div class="image-wrapper">
        <img src="${basePath}/SLEEP-BAG.png" class="item-img bag-img" />
        <div class="tog-overlay">${togValue}</div>
      </div>
    `;

    let infoPanelHtml = "";

    // RENDER FULL GUIDE
    if (showFullGuide) {
      const isRedActive = this._currentTemp >= 25;
      const isOrangeActive = this._currentTemp >= 20 && this._currentTemp < 25;
      const isYellowActive = this._currentTemp >= 16 && this._currentTemp < 20;
      const isBlueActive = this._currentTemp < 16;

      const getLiveBadge = (isActive) =>
        isActive
          ? `<div class="live-badge">${this._currentTemp.toFixed(1)}°C</div>`
          : "";

      infoPanelHtml = `
        <div class="full-panel has-active">
          <div class="full-row bg-red ${isRedActive ? "active-row" : ""}">
            <div class="full-col-temp">25°C<br><span style="font-size:0.8em; font-weight:normal;">and above<br>too hot</span>${getLiveBadge(isRedActive)}</div>
            <div class="full-col-bag">${getBagHtml("0.5")}</div>
            <div class="full-col-desc">
              <div class="desc-item"><span class="desc-text">27°C and above wear just a nappy or a sleeveless vest.</span><div class="desc-icons">${imgNappy} <span class="or">or</span> ${imgSleevelessVest}</div></div>
              <div class="desc-divider"></div>
              <div class="desc-item"><span class="desc-text">25-27°C wear 0.5 tog sleep bag with sleeveless vest.</span><div class="desc-icons">${imgSleevelessVest}</div></div>
            </div>
          </div>
          <div class="full-row bg-orange ${isOrangeActive ? "active-row" : ""}">
            <div class="full-col-temp">20°C<br>to 25°C<br><span style="font-size:0.8em; font-weight:normal;">getting warm</span>${getLiveBadge(isOrangeActive)}</div>
            <div class="full-col-bag">${getBagHtml("1.0")}</div>
            <div class="full-col-desc">
              <div class="desc-item"><span class="desc-text">22-25°C wear 1.0 tog sleep bag with a sleeveless vest.</span><div class="desc-icons">${imgSleevelessVest}</div></div>
              <div class="desc-divider"></div>
              <div class="desc-item"><span class="desc-text">20-22°C wear 1.0 tog sleep bag with a short-sleeved vest.</span><div class="desc-icons">${imgShortVest}</div></div>
            </div>
          </div>
          <div class="full-row bg-yellow ${isYellowActive ? "active-row" : ""}">
            <div class="full-col-temp">16°C<br>to 20°C<br><span style="font-size:0.8em; font-weight:normal;">ideal</span>${getLiveBadge(isYellowActive)}</div>
            <div class="full-col-bag">${getBagHtml("2.5")}</div>
            <div class="full-col-desc">
              <div class="desc-item"><span class="desc-text">18-20°C wear 2.5 tog sleep bag with a long-sleeved vest.</span><div class="desc-icons">${imgLongVest}</div></div>
              <div class="desc-divider"></div>
              <div class="desc-item"><span class="desc-text">16-18°C wear 2.5 tog sleep bag with a sleep suit.</span><div class="desc-icons">${imgSleepSuit}</div></div>
            </div>
          </div>
          <div class="full-row bg-blue ${isBlueActive ? "active-row" : ""}" style="${allowUserToggle ? "border-bottom: none;" : "border-radius: 0 0 20px 20px; border-bottom: none;"}">
            <div class="full-col-temp">16°C<br><span style="font-size:0.8em; font-weight:normal;">and below<br>too cold</span>${getLiveBadge(isBlueActive)}</div>
            <div class="full-col-bag">${getBagHtml("2.5")}</div>
            <div class="full-col-desc">
              <div class="desc-item"><span class="desc-text">16°C and below wear 2.5 tog sleep bag with a sleep suit and a long-sleeved vest.</span><div class="desc-icons">${imgSleepSuit} <span class="or">+</span> ${imgLongVest}</div></div>
            </div>
          </div>
          ${allowUserToggle ? `<div class="full-row-footer" id="toggle-view-btn">Show Live View</div>` : ""}
        </div>
      `;
    }
    // RENDER DYNAMIC WIDGET
    else {
      let bgClass = "";
      let title = "";
      let advice = "";
      let tog = "";
      let iconHtml = "";

      if (activeTemp >= 25) {
        bgClass = "bg-red";
        title = "25°C and above • Too Hot";
        if (activeTemp >= 27) {
          advice = "Wear just a nappy or a sleeveless vest.";
          tog = "0.0 tog";
          iconHtml = `${imgNappy} <span class="or">or</span> ${imgSleevelessVest}`;
        } else {
          advice = "Wear 0.5 tog sleep bag with a sleeveless vest.";
          tog = "0.5 tog";
          iconHtml = `${getBagHtml("0.5")} ${imgSleevelessVest}`;
        }
      } else if (activeTemp >= 20) {
        bgClass = "bg-orange";
        title = "20°C to 25°C • Getting Warm";
        if (activeTemp >= 22) {
          advice = "Wear 1.0 tog sleep bag with a sleeveless vest.";
          tog = "1.0 tog";
          iconHtml = `${getBagHtml("1.0")} ${imgSleevelessVest}`;
        } else {
          advice = "Wear 1.0 tog sleep bag with a short-sleeved vest.";
          tog = "1.0 tog";
          iconHtml = `${getBagHtml("1.0")} ${imgShortVest}`;
        }
      } else if (activeTemp >= 16) {
        bgClass = "bg-yellow";
        title = "16°C to 20°C • Ideal";
        if (activeTemp >= 18) {
          advice = "Wear 2.5 tog sleep bag with a long-sleeved vest.";
          tog = "2.5 tog";
          iconHtml = `${getBagHtml("2.5")} ${imgLongVest}`;
        } else {
          advice = "Wear 2.5 tog sleep bag with a sleep suit.";
          tog = "2.5 tog";
          iconHtml = `${getBagHtml("2.5")} ${imgSleepSuit}`;
        }
      } else {
        bgClass = "bg-blue";
        title = "16°C and below • Too Cold";
        advice =
          "Wear 2.5 tog sleep bag with a sleep suit and a long-sleeved vest.";
        tog = "2.5 tog";
        iconHtml = `${getBagHtml("2.5")} ${imgSleepSuit} <span class="or">+</span> ${imgLongVest}`;
      }

      let statusText = `Current: ${this._currentTemp.toFixed(1)}°C (${tog})`;
      if (isPreviewing) {
        statusText = `Preview: ${activeTemp.toFixed(1)}°C (${tog})`;
      }

      let actionButtonsHtml = "";
      if (isPreviewing || allowUserToggle) {
        actionButtonsHtml = `<div class="action-row">`;
        if (isPreviewing) {
          actionButtonsHtml += `<div class="action-btn" id="reset-btn">Reset to Live</div>`;
        }
        if (allowUserToggle) {
          actionButtonsHtml += `<div class="action-btn" id="toggle-view-btn">Show Full Guide</div>`;
        }
        actionButtonsHtml += `</div>`;
      }

      infoPanelHtml = `
        <div class="info-panel ${bgClass}">
          <div class="top-row">
            <div class="title">${title}</div>
            <div class="current-stat">${statusText}</div>
            <div class="advice">${advice}</div>
          </div>
          <div class="icon-layout">
            ${iconHtml}
          </div>
          ${actionButtonsHtml}
        </div>
      `;
    }

    let scaleHtml = "";
    for (let t = 28; t >= 14; t--) {
      let classes = "";
      if (t === actualDisplayTemp) classes += "actual ";
      if (isPreviewing && t === Math.round(activeTemp)) classes += "preview ";
      scaleHtml += `<div class="therm-num ${classes}">${t}</div>`;
    }

    let sliderHtml = "";
    if (!showFullGuide && showSlider) {
      const percent = Math.max(
        0,
        Math.min(100, ((28 - activeTemp) / 14) * 100),
      );
      sliderHtml = `
        <div class="slider-container" id="temp-slider-container">
          <div class="slider-track" id="temp-slider-line">
            <div class="slider-handle" style="top: ${percent}%">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M8 6h8v2H8zm0 5h8v2H8zm0 5h8v2H8zm0 5h8v2H8z"/>
              </svg>
            </div>
          </div>
        </div>
      `;
    }

    this.content.innerHTML = `
      <style>
        .baby-guide, .baby-guide * { box-sizing: border-box; }
        .baby-guide { display: flex; gap: 8px; font-family: var(--primary-font-family, sans-serif); padding: 8px; width: 100%; overflow: hidden; }
        .thermometer { width: 42px; background: #111; border-radius: 21px; display: flex; flex-direction: column; align-items: center; padding: 12px 0; color: #555; font-size: 13px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); flex-shrink: 0; }
        .therm-num { width: 100%; text-align: center; line-height: 1; display: flex; align-items: center; justify-content: center; user-select: none; transition: background 0.2s, color 0.2s; flex: 1; min-height: 0; }
        .therm-num.actual { color: #4da6ff; font-weight: bold; font-size: 15px; background: rgba(77, 166, 255, 0.15); border-radius: 5px; }
        .therm-num.preview { color: #fff; font-weight: bold; font-size: 15px; background: rgba(255, 255, 255, 0.25); border: 1px dashed rgba(255,255,255,0.8); border-radius: 5px; }
        .slider-container { width: 28px; display: flex; justify-content: center; padding: 20px 0; touch-action: none; cursor: pointer; flex-shrink: 0; }
        .slider-track { width: 4px; background: rgba(0,0,0,0.08); border-radius: 2px; height: 100%; position: relative; }
        .slider-handle { position: absolute; left: 50%; transform: translate(-50%, -50%); width: 22px; height: 22px; background: white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #666; cursor: grab; transition: background 0.1s, transform 0.1s; }
        .slider-container:active .slider-handle { cursor: grabbing; background: #f0f0f0; transform: translate(-50%, -50%) scale(1.1); }
        
        .bg-red { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; }
        .bg-orange { background: linear-gradient(135deg, #f39c12, #d35400); color: #fff; }
        .bg-yellow { background: linear-gradient(135deg, #f1c40f, #f39c12); color: #222 !important; }
        .bg-blue { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; }
        .or { font-weight: bold; opacity: 0.7; font-size: 1em; margin: 0 2px; flex-shrink: 0; }
        .bg-yellow .or { color: rgba(0,0,0,0.5); }
        
        .info-panel { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 12px; border-radius: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative; min-width: 0; }
        .title { font-size: 1.1em; font-weight: 800; margin-bottom: 3px; opacity: 0.9; word-wrap: break-word; line-height: 1.2; }
        .advice { font-size: 0.95em; line-height: 1.35; font-weight: 500; word-wrap: break-word; }
        .current-stat { font-size: 0.9em; opacity: 0.8; margin-bottom: 6px; font-weight: 600;}
        
        /* --- FLUID EQUALIZED ICON SETS --- */
        .icon-layout { display: flex; align-items: center; justify-content: center; margin: 8px 0; gap: 12px; width: 100%; height: 60px; }
        .icon-layout .item-img { height: 100%; width: auto; display: block; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.15)); object-fit: contain; }
        .image-wrapper { position: relative; display: inline-block; height: 100%; }
        .image-wrapper .item-img { height: 100%; width: auto; }
        .icon-layout .tog-overlay { position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); font-weight: 800; font-size: 0.85em; color: #fff; text-shadow: 0px 1px 3px rgba(0,0,0,0.5); }
        
        /* --- BUTTON LAYOUT WITH RESPONSIVE SAFETY WRAPPING --- */
        .action-row { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; margin-top: 8px; }
        .action-row .action-btn { flex: 1; min-width: 85px; margin-top: 0; }
        .action-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); padding: 9px 4px; border-radius: 10px; font-weight: bold; font-size: 0.8em; cursor: pointer; text-align: center; transition: background 0.2s; color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); user-select: none; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
        .bg-yellow .action-btn { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); color: #333; }
        .action-btn:hover { background: rgba(255,255,255,0.3); }
        .bg-yellow .action-btn:hover { background: rgba(0,0,0,0.1); }
        
        .full-panel { flex: 1; display: flex; flex-direction: column; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; min-width: 0; }
        .full-row { display: flex; padding: 15px 10px; border-bottom: 1px solid rgba(0,0,0,0.15); transition: opacity 0.3s ease; }
        .full-row:first-child { border-radius: 20px 20px 0 0; }
        .bg-yellow.full-row { border-bottom: 1px solid rgba(0,0,0,0.05); }
        
        /* --- FULL VIEW VISUAL ACCENTS --- */
        .full-panel.has-active .full-row:not(.active-row) { opacity: 0.6; filter: saturate(0.85); }
        .full-row.active-row { border-left: 6px solid #fff; padding-left: 4px; box-shadow: inset 4px 0 10px rgba(255,255,255,0.1); }
        .bg-yellow.full-row.active-row { border-left-color: #222; }
        
        .live-badge { background: #fff; color: #222; padding: 3px 6px; border-radius: 8px; font-size: 0.75em; font-weight: 800; margin-top: 6px; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.2); animation: livePulse 2s infinite; white-space: nowrap; text-shadow: none; }
        .bg-yellow .live-badge { background: #222; color: #fff; animation: livePulseDark 2s infinite; }
        
        @keyframes livePulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes livePulseDark {
          0% { box-shadow: 0 0 0 0 rgba(34,34,34,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(34,34,34,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,34,34,0); }
        }

        .full-col-temp { width: 70px; font-weight: bold; font-size: 1.1em; text-align: center; padding-right: 10px; line-height: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .full-col-bag { width: 50px; display: flex; align-items: center; justify-content: center; margin-right: 10px; }
        .full-col-bag .item-img { height: 50px; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.15)); }
        .full-col-bag .tog-overlay { position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); font-weight: 800; font-size: 0.7em; color: #fff; text-shadow: 0px 1px 2px rgba(0,0,0,0.5); }
        .full-col-desc { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .desc-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .desc-text { font-size: 0.85em; line-height: 1.3; flex: 1;}
        .desc-icons { display: flex; align-items: center; justify-content: flex-end;}
        .desc-icons .item-img { height: 32px; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.15)); }
        .desc-divider { height: 1px; background: rgba(255,255,255,0.2); margin: 8px 0; }
        .bg-yellow .desc-divider { background: rgba(0,0,0,0.1); }
        .full-row-footer { background: #2a2a2a; color: #eee; text-align: center; padding: 12px; border-radius: 0 0 20px 20px; font-weight: bold; cursor: pointer; font-size: 0.9em; transition: background 0.2s; }
        .full-row-footer:hover { background: #111; }
      </style>
      
      <div class="baby-guide ${viewModeClass} ${sliderClass}">
        ${showFullGuide ? "" : `<div class="thermometer">${scaleHtml}</div>`}
        ${sliderHtml}
        ${infoPanelHtml}
      </div>
    `;

    if (!this._eventsBound) {
      this.content.addEventListener(
        "pointerdown",
        this.onPointerDown.bind(this),
      );
      this.content.addEventListener("click", this.onClick.bind(this));
      this._eventsBound = true;
    }
  }
}

// ==============================================================================
// VISUAL CONFIGURATION EDITOR
// ==============================================================================
class BabyRoomGuideCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  get hass() {
    return this._hass;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._config || !this._hass) return;

    let form = this.querySelector("ha-form");
    if (!form) {
      form = document.createElement("ha-form");
      form.schema = [
        { name: "entity", selector: { entity: { domain: "sensor" } } },
        { name: "show_full_guide", selector: { boolean: {} } },
        { name: "show_slider", selector: { boolean: {} } },
        { name: "user_toggle_full_view", selector: { boolean: {} } },
      ];
      form.computeLabel = (schema) => {
        const labels = {
          entity: "Temperature Sensor",
          show_full_guide: "Default to Full Guide View",
          show_slider: "Enable Drag Slider Preview",
          user_toggle_full_view: "Enable Expand/Collapse Button",
        };
        return labels[schema.name] || schema.name;
      };
      form.addEventListener("value-changed", (ev) => {
        this._valueChanged(ev);
      });
      this.innerHTML = "";
      this.appendChild(form);
    }

    form.hass = this._hass;
    form.data = this._config;
  }

  _valueChanged(ev) {
    if (!this._config) return;
    const newConfig = ev.detail.value;

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define("baby-room-guide-card-editor", BabyRoomGuideCardEditor);
customElements.define("baby-room-guide-card", BabyRoomGuideCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "baby-room-guide-card",
  name: "Baby Room Guide",
  preview: true,
  description: "Dynamic room thermometer with interactive Tog visual guide.",
});
