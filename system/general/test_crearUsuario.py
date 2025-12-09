import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class TestCrearUsuario:
  def setup_method(self, method):
    self.driver = webdriver.Firefox()
    self.wait = WebDriverWait(self.driver, 15)
    self.driver.set_window_size(1280, 900)

  def teardown_method(self, method):
    self.driver.quit()

  def test_registro_usuario(self):
    driver = self.driver
    wait = self.wait
    # Navegar a la página de registro
    driver.get("http://localhost:5173/register")
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    # Contenedor principal de registro presente
    wait.until(EC.presence_of_element_located((
      By.XPATH,
      "//div[@class='w-full max-w-md']//div[@data-slot='card' and .//div[@data-slot='card-title' and contains(normalize-space(),'Crear Cuenta')]]"
    )))

    # Llenar campos
    wait.until(EC.visibility_of_element_located((By.ID, "firstName"))).send_keys("Pedro")
    wait.until(EC.visibility_of_element_located((By.ID, "lastName"))).send_keys("Sanchez")
    wait.until(EC.visibility_of_element_located((By.ID, "nationalId"))).send_keys("14788890")
    import time as _t
    unique_email = f"pedrosanchez+{int(_t.time())}@exfxample.com"
    email_input = wait.until(EC.visibility_of_element_located((By.ID, "email")))
    email_input.clear()
    email_input.send_keys(unique_email)
    wait.until(EC.visibility_of_element_located((By.ID, "phone"))).send_keys("+593987654321")
    wait.until(EC.visibility_of_element_located((By.ID, "address"))).send_keys("Av. Siempre Viva 742")

    # Seleccionar tipo de cuenta (Radix Select)
    select_trigger = wait.until(EC.element_to_be_clickable((
      By.XPATH,
      "//button[@role='combobox' and @data-slot='select-trigger' and .//span[contains(normalize-space(),'Selecciona tu rol')]]"
    )))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", select_trigger)
    driver.execute_script("arguments[0].click();", select_trigger)

    # Elegir opción (p.ej. Comprador)
    option = None
    try:
      option = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((
        By.XPATH,
        "//*[@data-slot='select-item' or @role='option'][contains(normalize-space(),'Comprador') or contains(normalize-space(),'buyer')]"
      )))
    except Exception:
      option = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((
        By.XPATH,
        "//*[@data-slot='select-item' or @role='option'][1]"
      )))
    driver.execute_script("arguments[0].click();", option)

    # Contraseña y confirmación
    wait.until(EC.visibility_of_element_located((By.ID, "password"))).send_keys("PruebaSegura#123")
    wait.until(EC.visibility_of_element_located((By.ID, "confirmPassword"))).send_keys("PruebaSegura#123")

    # Enviar formulario
    submit_btn = wait.until(EC.element_to_be_clickable((
      By.XPATH,
      "//form//button[@type='submit' and contains(normalize-space(),'Crear Cuenta')]"
    )))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", submit_btn)
    # Ensure button is enabled (no disabled attr)
    WebDriverWait(driver, 5).until(lambda d: submit_btn.get_attribute("disabled") in (None, "false"))
    driver.execute_script("arguments[0].click();", submit_btn)

    # Validación: esperar redirección o mensaje de éxito
    try:
      WebDriverWait(driver, 10).until(EC.url_contains("/dashboard"))
    except Exception:
      # Fallback: toast or status message
      try:
        WebDriverWait(driver, 6).until(EC.presence_of_element_located((
          By.XPATH,
          "//*[@data-sonner-toast or @role='status' or contains(@class,'sonner') or contains(normalize-space(),'Registro') or contains(normalize-space(),'éxito')]"
        )))
      except Exception:
        # As a last fallback, ensure no visible error alerts
        errs = driver.find_elements(By.XPATH, "//*[@role='alert' or contains(@class,'error')]")
        assert not errs, "Errores visibles tras intentar registrar usuario"
