from playwright.sync_api import sync_playwright

def check():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to mobile size
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        page.on("pageerror", lambda err: print(err))

        page.goto('http://127.0.0.1:3000')
        page.wait_for_timeout(3000)
        page.screenshot(path='/home/jules/verification/mobile_ui_bottom.png')
        browser.close()

if __name__ == '__main__':
    check()
