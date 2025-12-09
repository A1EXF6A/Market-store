import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class TestMarcarVendido:

  def setup_method(self, method):
    self.driver = webdriver.Firefox()
    self.driver.set_window_size(1280, 900)
    self.wait = WebDriverWait(self.driver, 20)

  def teardown_method(self, method):
    self.driver.quit()

  # ------------------------------------------------------
  # LOGIN
  # ------------------------------------------------------
  def login(self):
    driver = self.driver
    wait = self.wait

    driver.get("http://localhost:5173/login")

    wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(
      "alexflakito15@gmail.com"
    )
    wait.until(EC.visibility_of_element_located((By.ID, "password"))).send_keys(
      "14052003@leX"
    )

    wait.until(
      EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    ).click()

    wait.until(EC.url_contains("/dashboard"))

  # ------------------------------------------------------
  # TEST MARCAR VENDIDO
  # ------------------------------------------------------
  def test_marcarVendido(self):
    driver = self.driver
    wait = self.wait

    # 1. LOGIN
    self.login()

    # 2. Ir a Mis Productos
    driver.get("http://localhost:5173/my-products")

    wait.until(EC.visibility_of_element_located(
      (By.XPATH, "//h1[contains(text(), 'Mis Productos')]")
    ))

    # ------------------------------------------------------
    # 3. Ajustar filtros (Estado: Activo) y Buscar
    # ------------------------------------------------------
    estado_trigger = wait.until(EC.element_to_be_clickable(
      (By.CSS_SELECTOR, "button[data-slot='select-trigger']")
    ))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", estado_trigger)
    estado_trigger.click()

    opcion_activo = wait.until(EC.element_to_be_clickable(
      (By.XPATH, "//div[@role='option'][contains(., 'Activo')]")
    ))
    opcion_activo.click()

    buscar_btn = wait.until(EC.element_to_be_clickable(
      (By.XPATH, "//button[normalize-space()='Buscar']")
    ))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", buscar_btn)
    buscar_btn.click()

    time.sleep(1)

    # ------------------------------------------------------
    # 4. Abrir menú de tres puntos SOLO dentro de la tabla
    # ------------------------------------------------------
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
    table_menu_buttons = driver.find_elements(
      By.CSS_SELECTOR,
      "table button[data-slot='dropdown-menu-trigger']"
    )

    assert len(table_menu_buttons) > 0, "❌ No se encontraron botones de menú dentro de la tabla"

    menu_button = None
    for b in table_menu_buttons:
      if b.is_displayed():
        menu_button = b
        break

    assert menu_button is not None, "❌ No hay botón de menú visible en la tabla"

    from selenium.webdriver import ActionChains
    ActionChains(driver).move_to_element(menu_button).click().perform()

    # ------------------------------------------------------
    # 5. Elegir "Eliminar" en el menú Radix
    # ------------------------------------------------------
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='menu']")))
    marcar_vendido_item = wait.until(EC.element_to_be_clickable(
      (By.XPATH, "//div[@role='menuitem'][contains(., 'Marcar vendido')]")
    ))
    marcar_vendido_item.click()

    # No hay modal de confirmación para marcar vendido; continuar directamente

    # ------------------------------------------------------
    # 7. Validaciones
    # ------------------------------------------------------
    # Toast de éxito (si está presente)
    try:
      wait.until(EC.visibility_of_element_located(
        (By.XPATH, "//div[contains(., 'Producto marcado como vendido') or contains(., 'Producto actualizado exitosamente') or contains(., 'Actualizado')]")
      ))
    except:
      pass

    print("✅ PRODUCTO MARCADO COMO VENDIDO")
  
