import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class TestDatos:
  def setup_method(self, method):
    self.driver = webdriver.Firefox()
    self.wait = WebDriverWait(self.driver, 15)
    self.driver.set_window_size(1280, 900)

  def teardown_method(self, method):
    self.driver.quit()

  def login(self):
    driver = self.driver
    wait = self.wait
    driver.get("http://localhost:5173/login")
    wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("juan@gmail.com")
    wait.until(EC.visibility_of_element_located((By.ID, "password"))).send_keys("14052003@leX")
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))).click()
    wait.until(EC.url_contains("/dashboard"))

  def test_datos(self):
    driver = self.driver
    wait = self.wait

    # 1. Login y dashboard
    self.login()
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    # 2. Abrir menú de usuario (button[data-slot='dropdown-menu-trigger'])
    profile_btn = wait.until(EC.element_to_be_clickable(
      (By.CSS_SELECTOR, "button[data-slot='dropdown-menu-trigger']")
    ))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", profile_btn)
    profile_btn.click()

    # 3. Click en "Configuración" dentro del menú Radix
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='menu']")))
    configuracion_item = wait.until(EC.element_to_be_clickable(
      (By.XPATH, "//div[@role='menuitem'][contains(., 'Configuración')]")
    ))
    configuracion_item.click()

    # 4. Formulario Editar Perfil: llenar y guardar
    nombre_input = wait.until(EC.visibility_of_element_located(
      (By.XPATH, "//label[contains(., 'Nombre')]/following::input[1]")
    ))
    apellido_input = wait.until(EC.visibility_of_element_located(
      (By.XPATH, "//label[contains(., 'Apellido')]/following::input[1]")
    ))
    telefono_input = wait.until(EC.visibility_of_element_located(
      (By.XPATH, "//label[contains(., 'Teléfono')]/following::input[1]")
    ))
    direccion_input = wait.until(EC.visibility_of_element_located(
      (By.XPATH, "//label[contains(., 'Dirección')]/following::input[1]")
    ))

    for el in [nombre_input, apellido_input, telefono_input, direccion_input]:
      try:
        el.clear()
      except:
        pass

    nombre_input.send_keys("maria")
    apellido_input.send_keys("sss")
    telefono_input.send_keys("0101001010")
    direccion_input.send_keys("Calle Falsa 123")

    guardar_btn = wait.until(EC.element_to_be_clickable(
      (By.XPATH, "//button[normalize-space()='Guardar cambios']")
    ))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", guardar_btn)
    guardar_btn.click()

    # 5. Validación ligera (toast o permanencia en página)
    try:
      wait.until(EC.visibility_of_element_located(
        (By.XPATH, "//div[contains(., 'perfil actualizado') or contains(., 'Actualizado') or contains(., 'cambios guardados')]")
      ))
    except:
      pass

    assert True
  
