# Sticky Header Debug Guide

## Quick Verification Steps

### 1. Check Browser DevTools

Open Chrome DevTools (F12) and follow these steps:

#### Step 1: Inspect the Header Element
```
1. Start the assessment
2. Right-click on the header (the part with timer and webcam)
3. Select "Inspect"
4. Look for element with class "page__header page__header--sticky"
```

#### Step 2: Verify Computed Styles
In the "Computed" tab, verify these properties:
```
position: sticky (should show "sticky", not "static")
top: 0px
z-index: 1000
display: flex
```

#### Step 3: Check Parent Containers
Look at the parent elements (click through them in the Elements tree):
- `.page` should NOT have overflow: hidden (only overflow-x might be okay)
- `body` should NOT have overflow: hidden
- `html` should NOT have overflow: hidden

### 2. Test Scrolling

```
1. Start a psychometric assessment
2. Begin the test
3. Scroll down the page slowly
4. The header should "stick" to the top of the viewport
5. Continue scrolling - header should remain at the top
6. Scroll back up - header should scroll back with the page
```

### 3. If Sticky Still Not Working

#### Option A: Check for Overflow Issues
Run this in the Console tab:

```javascript
// Check for overflow on parents
const header = document.querySelector('.page__header--sticky');
let el = header;
while (el) {
  const style = window.getComputedStyle(el);
  const overflow = {
    overflowY: style.overflowY,
    overflowX: style.overflowX,
    overflow: style.overflow,
    position: style.position
  };
  console.log(el.className || el.tagName, overflow);
  el = el.parentElement;
}
```

Look for any parent with `overflow: hidden`, `overflow: auto`, or `overflow: scroll` in the overflowY - this will break sticky positioning.

#### Option B: Force Sticky with JavaScript (Temporary Test)
Run this in the Console tab:

```javascript
const header = document.querySelector('.page__header--sticky');
header.style.position = 'sticky';
header.style.top = '0';
header.style.zIndex = '1000';
console.log('Sticky styles applied. Try scrolling now.');
```

If this works, there's a CSS specificity or loading issue.

#### Option C: Check if Content is Tall Enough
```javascript
console.log('Body height:', document.body.scrollHeight);
console.log('Window height:', window.innerHeight);
console.log('Can scroll:', document.body.scrollHeight > window.innerHeight);
```

Sticky only works if there's content to scroll. The body height should be greater than window height.

### 4. Browser Compatibility Test

Test in multiple browsers:
- Chrome/Edge: Should work perfectly
- Firefox: Should work perfectly
- Safari: Should work with -webkit-sticky prefix (already added)

### 5. Manual CSS Override Test

If sticky still doesn't work, try adding this CSS temporarily to test:

```css
/* Add to psychometric.css temporarily for testing */
.page__header--sticky {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  margin: 0 !important;
  width: 100% !important;
}

/* Add padding to content below */
.section-tabs {
  margin-top: 200px !important;
}
```

If `position: fixed` works but `position: sticky` doesn't, there's definitely a parent container issue.

## Common Issues and Solutions

### Issue: Header scrolls away completely
**Cause:** Sticky is not being applied
**Solution:** 
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check parent containers for overflow issues
- Verify CSS was saved and reloaded

### Issue: Header appears but jumps around
**Cause:** Multiple CSS rules conflicting or z-index issues
**Solution:**
- Check for duplicate class names
- Verify no inline styles on the element
- Check browser console for CSS errors

### Issue: Header sticks but content overlaps
**Cause:** Content below doesn't have enough top margin
**Solution:**
- Increase margin-top on `.section-tabs`
- Add padding-top to content containers

### Issue: Works on desktop but not mobile
**Cause:** Responsive CSS overriding sticky
**Solution:**
- Check media queries at bottom of psychometric.css
- Ensure mobile breakpoints also have position: sticky

## Expected Behavior

✅ **Correct Behavior:**
- Header is visible at top when page loads
- When you scroll down, header moves up initially
- As header reaches top of viewport, it "sticks"
- Header stays at top while rest of page scrolls beneath it
- Timer continues updating smoothly
- Camera feed continues streaming
- No flickering or jumping

❌ **Incorrect Behavior:**
- Header scrolls away completely (sticky not working)
- Header jumps or flickers during scroll
- Content overlaps the header
- Header appears disconnected from page

## CSS Changes Made

### Changes that Fixed Overflow Issues:
1. **html/body**: Removed height constraints, ensured overflow-y can scroll
2. **.page**: Removed overflow properties that could break sticky
3. **.page__header**: Changed overflow from hidden to visible
4. **.page__header--sticky**: Added webkit prefixes and isolation

### Key CSS Properties:
```css
.page__header--sticky {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 1000;
  isolation: isolate;
}
```

## If Nothing Works

Try the "Nuclear Option" - Replace the sticky header section in `psychometric.css`:

```css
.page__header--sticky {
  position: fixed !important;
  top: 0 !important;
  left: 50% !important;
  transform: translateX(-50%) translateZ(0) !important;
  z-index: 10000 !important;
  max-width: 100vw !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 20px 28px !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

/* Add space below header */
.page__header--sticky + * {
  margin-top: 180px !important;
}
```

This uses `position: fixed` instead of `sticky` which is less elegant but guaranteed to work.

## Contact Developer

If you've tried all the above and it still doesn't work:
1. Take a screenshot of the Chrome DevTools Elements tab showing the header
2. Take a screenshot of the Computed styles
3. Copy the console output from Option A above
4. Note which browser and version you're using

---

**Last Updated:** December 23, 2025






