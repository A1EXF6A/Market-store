import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class TestLogin:
  def setup_method(self, method):
    self.driver = webdriver.Firefox()
    self.wait = WebDriverWait(self.driver, 15)
    self.driver.set_window_size(1280, 900)

  def teardown_method(self, method):
    self.driver.quit()

  def test_login(self):
    driver = self.driver
    wait = self.wait

    driver.get("http://localhost:5173/login")

    wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("juan@gmail.com")
    wait.until(EC.visibility_of_element_located((By.ID, "password"))).send_keys("14052003@leX")

    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))).click()

    # Confirm navigation to dashboard/home after login
    wait.until(EC.url_contains("/dashboard"))

    # Smoke check: page has a body and some expected element
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    assert "/dashboard" in driver.current_url, "❌ No se llegó al dashboard tras login"
  
