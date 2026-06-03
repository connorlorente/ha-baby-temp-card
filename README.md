# Safe Sleep Baby Room Guide Card

An interactive Home Assistant Lovelace card designed to help parents maintain a safe sleeping environment in the nursery. By digitizing the physical "What to Wear" thermometer reference guide, this card helps prevent infant overheating, which is a known environmental risk factor for Sudden Infant Death Syndrome (SIDS).

This card monitors your nursery's temperature sensor and provides instant, clear visual cues on exactly how to dress your baby using the correct clothing layers and sleep bag Tog ratings.

## Previews

<p align="center">
  <img src="https://raw.githubusercontent.com/connorlorente/ha-baby-temp-card/main/images/rm_full-view.jpg" alt="Baby Room Guide Full Chart View" width="400"/>
  <img src="https://raw.githubusercontent.com/connorlorente/ha-baby-temp-card/main/images/rm_widget-view.jpg" alt="Baby Room Guide Widget View" width="400"/>
</p>

## Origin & Credits

The data and layout layers used in this card are digitized directly from the physical reference card included with baby sleep products from [**sweetdreamers.co.uk**](http://sweetdreamers.co.uk/).

---

## Features

- **SIDS Risk Reduction:** Clear, color-coded temperature zones (Too Hot, Getting Warm, Ideal, Too Cold) based on safe sleep guidelines.
- **Interactive Clothing Calculator:** Tap "Show Full Guide" to see the complete tabular breakdown, or use the drag slider to preview outfits for shifting night-time temperatures.
- **Mobile-Optimized Layout:** Proportional flexbox scaling ensures the card and its clothing icons remain perfectly contained on phone screens without overflowing your dashboard.
- **Smart Live Isolation:** When viewing the full chart, the non-matching temperature tiers are gently dimmed by 60%, drawing your eye directly to the current live nursery status row.

---

## Installation

### Method 1: Direct 1-Click HACS Add

If you have configured the "My Home Assistant" redirection service on your instance, click the badge below to open this repository inside HACS instantly:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=connorlorente&repository=ha-baby-temp-card&category=plugin)

### Method 2: Manual Custom Repository Add in HACS

1. Open your **Home Assistant Dashboard**.
2. Navigate to **HACS** -> **Frontend**.
3. Click the three dots in the top-right corner and select **Custom repositories**.
4. Paste your GitHub repository URL: `https://github.com/connorlorente/ha-baby-temp-card`
5. Select **Lovelace** (or Frontend) as the Category and click **Add**.
6. Find the **Baby Room Guide** card element in your list and click **Download**.

---

## Configuration

The card fully supports the native visual UI configuration form. If configuring manually via YAML code, use the following parameters:

### Configuration Options

| Parameter               | Type    | Required | Default                       | Description                                                                  |
| :---------------------- | :------ | :------- | :---------------------------- | :--------------------------------------------------------------------------- |
| `type`                  | string  | **Yes**  | `custom:baby-room-guide-card` | The custom element signature.                                                |
| `entity`                | string  | **Yes**  | None                          | Your nursery temperature sensor entity (e.g., `sensor.nursery_temperature`). |
| `show_full_guide`       | boolean | No       | `false`                       | Defaults card directly to the full safe sleep tabular chart layout.          |
| `show_slider`           | boolean | No       | `true`                        | Enables the vertical drag preview timeline scale.                            |
| `user_toggle_full_view` | boolean | No       | `true`                        | Shows or hides the dynamic expand/collapse footer buttons.                   |

### Sample YAML Implementation

```yaml
type: custom:baby-room-guide-card
entity: sensor.nursery_temperature
show_full_guide: false
show_slider: true
user_toggle_full_view: true
```

## Disclaimer

This custom card is an execution aid based specifically on the physical reference card from sweetdreams.co.uk. Please be aware that very little testing has been done on this codebase. You should thoroughly test the card yourself and use it in close correlation with other reliable room temperature sources. Furthermore, baby clothing and safe temperature guidelines vary globally. You must perform your own independent checks to verify these suggested clothing ranges against the official safe sleep advice recommended by healthcare authorities in your specific region.
