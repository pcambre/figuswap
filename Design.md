# Application Concept: StickerSwap Matcher

## Overview
A responsive, single-page React application designed to help sticker collectors compare their inventories with friends. The app takes two text inputs (copied from external album-tracking apps like Figuritas or Figuri), parses the "needs" and "swaps/repeats", and outputs the exact stickers the two users can trade with each other.

## Target Audience
Sticker collectors (specifically referencing the 2026 Global Cup) who need a quick, frictionless way to find trade matches without manually cross-referencing long text lists.

## Visual Language
* **Theme:** Modern, clean, and highly legible. 
* **Color Palette:**
    * **Background:** `#F9FAFB` (Light gray for a soft, frictionless feel)
    * **Surface:** `#FFFFFF` (White for cards and inputs)
    * **Primary:** `#2563EB` (Vibrant blue for primary actions and focused states)
    * **Success:** `#16A34A` (Green for successful matches/trades)
    * **Text:** `#1F2937` (Dark gray for high contrast readability)
    * **Text Muted:** `#6B7280` (Medium gray for placeholders and secondary info)
* **Typography:** System fonts (`Inter`, `San Francisco`, `Roboto`). Focus on tabular lining for numbers to ensure sticker numbers align nicely.
* **Spacing:** Use a consistent 8px/16px/24px spacing scale to separate distinct logical blocks.

---

## State Management

The application state should track the raw input and the parsed outputs for both users.

```javascript
{
  myListRaw: string,      // Raw pasted text from User 1
  theirListRaw: string,   // Raw pasted text from User 2
  parsedData: {
    me: {
      needs: { countryCode: [numbers] }, // e.g., { "ARG": [1, 4, 6] }
      swaps: { countryCode: [numbers] }
    },
    them: {
      needs: { countryCode: [numbers] },
      swaps: { countryCode: [numbers] }
    }
  },
  matches: {
    iGiveThem: { countryCode: [numbers] }, // Intersection: my swaps + their needs
    theyGiveMe: { countryCode: [numbers] } // Intersection: my needs + their swaps
  },
  errors: string[] // For parsing failures
}