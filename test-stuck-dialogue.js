import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const errors = [];
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[JS ERROR] ${error.message}`);
  });
  
  try {
    console.log('=== TESTING FOR STUCK DIALOGUE AFTER CHOICE ===\n');
    
    // Step 1: Start game
    console.log('Step 1: Starting game...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.click('#btn-new-game');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'stuck-test-1-start.png' });
    console.log('✓ Game started, screenshot saved: stuck-test-1-start.png\n');
    
    // Step 2: Click through dialogue rapidly
    console.log('Step 2: Clicking through dialogue to reach choices...');
    let clickCount = 0;
    let foundChoice = false;
    
    while (clickCount < 35 && !foundChoice) {
      clickCount++;
      
      // Check for choice panel
      const state = await page.evaluate(() => {
        const choicePanel = document.querySelector('.choice-panel');
        const dialogueBox = document.querySelector('.dialogue-box');
        return {
          choiceVisible: choicePanel?.classList.contains('visible'),
          dialogueVisible: dialogueBox?.classList.contains('visible'),
          choices: Array.from(document.querySelectorAll('.choice-btn')).map(btn => btn.textContent?.trim()),
          dialogueText: document.querySelector('.dialogue-text')?.textContent
        };
      });
      
      if (state.choiceVisible && state.choices.length > 0) {
        console.log(`✓ Choice panel reached after ${clickCount} clicks`);
        console.log('  Choices available:');
        state.choices.forEach((choice, i) => {
          console.log(`    ${i + 1}. ${choice}`);
        });
        foundChoice = true;
        await page.screenshot({ path: 'stuck-test-2-choices.png' });
        console.log('  Screenshot saved: stuck-test-2-choices.png\n');
        break;
      }
      
      // Click dialogue box at bottom of screen
      await page.evaluate(() => {
        const dialogueBox = document.querySelector('.dialogue-box');
        if (dialogueBox) dialogueBox.click();
      });
      
      await page.waitForTimeout(2000);
      
      if (clickCount % 5 === 0) {
        console.log(`  Click ${clickCount}: ${state.dialogueText?.substring(0, 50)}...`);
      }
    }
    
    if (!foundChoice) {
      console.log('⚠ Did not reach choice panel\n');
      return;
    }
    
    // Step 3: Click FIRST choice
    console.log('Step 3: Clicking FIRST choice (前往长城守卫处)...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('.choice-btn');
      if (buttons[0]) {
        console.log('Clicking first choice button');
        buttons[0].click();
      }
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'stuck-test-3-after-choice.png' });
    console.log('✓ First choice clicked, screenshot saved: stuck-test-3-after-choice.png\n');
    
    // Step 4: Try to advance dialogue
    console.log('Step 4: Testing dialogue advancement after choice...');
    
    const postChoiceDialogues = [];
    let isStuck = false;
    let previousText = '';
    let sameTextCount = 0;
    
    for (let i = 1; i <= 10; i++) {
      // Check current state
      const state = await page.evaluate(() => {
        const dialogueBox = document.querySelector('.dialogue-box');
        const choicePanel = document.querySelector('.choice-panel');
        const battleUI = document.querySelector('.battle-ui');
        
        return {
          dialogueVisible: dialogueBox?.classList.contains('visible'),
          dialogueText: document.querySelector('.dialogue-text')?.textContent,
          speaker: document.querySelector('.speaker-name')?.textContent,
          tapHintVisible: document.querySelector('.tap-hint')?.style.display !== 'none',
          choiceVisible: choicePanel?.classList.contains('visible'),
          battleVisible: battleUI?.classList.contains('visible'),
          // Check for potential blocking elements
          dialogueBoxRect: dialogueBox?.getBoundingClientRect(),
          overlappingElements: Array.from(document.elementsFromPoint(640, 600)).map(el => ({
            tag: el.tagName,
            classes: Array.from(el.classList),
            zIndex: window.getComputedStyle(el).zIndex
          }))
        };
      });
      
      console.log(`  Click ${i}:`);
      console.log(`    Dialogue visible: ${state.dialogueVisible}`);
      console.log(`    Speaker: ${state.speaker || '(narrator)'}`);
      console.log(`    Text: "${state.dialogueText?.substring(0, 60)}..."`);
      console.log(`    Tap hint: ${state.tapHintVisible ? 'Visible' : 'Hidden'}`);
      console.log(`    Choice panel: ${state.choiceVisible}`);
      console.log(`    Battle: ${state.battleVisible}`);
      
      // Check if stuck on same text
      if (state.dialogueText === previousText) {
        sameTextCount++;
        if (sameTextCount >= 3) {
          console.log(`    ⚠ WARNING: Same text for ${sameTextCount} clicks - may be stuck!`);
          isStuck = true;
        }
      } else {
        sameTextCount = 0;
      }
      previousText = state.dialogueText;
      
      postChoiceDialogues.push({
        click: i,
        speaker: state.speaker,
        text: state.dialogueText
      });
      
      // Check for battle or new choices
      if (state.battleVisible) {
        console.log('  ✓ Battle scene reached\n');
        break;
      }
      if (state.choiceVisible) {
        console.log('  ✓ New choice panel appeared\n');
        break;
      }
      
      // Try to click dialogue
      const clickResult = await page.evaluate(() => {
        const dialogueBox = document.querySelector('.dialogue-box');
        if (dialogueBox && dialogueBox.classList.contains('visible')) {
          dialogueBox.click();
          return 'clicked';
        }
        return 'not clickable';
      });
      
      console.log(`    Click result: ${clickResult}`);
      
      if (i === 5) {
        await page.screenshot({ path: 'stuck-test-4-mid-dialogue.png' });
        console.log('    Screenshot saved: stuck-test-4-mid-dialogue.png');
      }
      
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'stuck-test-5-final.png' });
    console.log('  Screenshot saved: stuck-test-5-final.png\n');
    
    // Step 5: Check for expected dialogue progression
    console.log('Step 5: Dialogue Progression Analysis:');
    console.log(`  Total dialogue lines after choice: ${postChoiceDialogues.length}`);
    
    const expectedTexts = ['你向北前行', '气氛不对', '太安静了'];
    const foundExpectedTexts = expectedTexts.map(text => 
      postChoiceDialogues.some(d => d.text?.includes(text))
    );
    
    console.log('  Expected texts check:');
    expectedTexts.forEach((text, i) => {
      console.log(`    "${text}": ${foundExpectedTexts[i] ? '✓ Found' : '✗ Not found'}`);
    });
    
    // Show progression
    console.log('\n  Dialogue progression:');
    postChoiceDialogues.slice(0, 7).forEach(d => {
      console.log(`    ${d.click}. [${d.speaker || 'narrator'}] ${d.text?.substring(0, 50)}...`);
    });
    
    // Step 6: Check for blocking elements
    if (isStuck) {
      console.log('\nStep 6: Checking for blocking elements...');
      const blockingCheck = await page.evaluate(() => {
        const dialogueBox = document.querySelector('.dialogue-box');
        const centerX = window.innerWidth / 2;
        const bottomY = window.innerHeight - 100;
        
        const elementsAtPoint = document.elementsFromPoint(centerX, bottomY);
        
        return {
          dialogueBoxIndex: elementsAtPoint.findIndex(el => el.classList.contains('dialogue-box')),
          elementsAtDialogueArea: elementsAtPoint.map(el => ({
            tag: el.tagName,
            id: el.id,
            classes: Array.from(el.classList),
            zIndex: window.getComputedStyle(el).zIndex,
            pointerEvents: window.getComputedStyle(el).pointerEvents
          }))
        };
      });
      
      console.log(`  Dialogue box z-order: ${blockingCheck.dialogueBoxIndex} (0 = on top)`);
      console.log('  Elements at dialogue area:');
      blockingCheck.elementsAtDialogueArea.slice(0, 5).forEach((el, i) => {
        console.log(`    ${i}. <${el.tag}> ${el.classes.join(' ')} z-index:${el.zIndex} pointer-events:${el.pointerEvents}`);
      });
    }
    
    // Final report
    console.log('\n=== FINAL REPORT ===');
    console.log('JavaScript Errors:', errors.length);
    
    if (isStuck) {
      console.log('Result: ⚠ DIALOGUE MAY BE STUCK');
      console.log('  - Same text repeated multiple times');
      console.log('  - Progression may be blocked');
    } else if (postChoiceDialogues.length >= 5) {
      console.log('Result: ✓ DIALOGUE ADVANCES NORMALLY');
      console.log('  - Multiple different dialogue lines observed');
      console.log('  - No stuck behavior detected');
    } else {
      console.log('Result: ⚠ INSUFFICIENT DATA');
      console.log('  - Too few dialogue lines to determine');
    }
    
    console.log('\nBrowser stays open for 5 seconds...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await browser.close();
  }
})();
