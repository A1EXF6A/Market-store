import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TestReportes:
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

  def test_reportar_producto(self):
    driver = self.driver
    wait = self.wait

    # 1) Login y dashboard
    self.login()
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    # 2) Ir a Productos
    productos_link = wait.until(EC.element_to_be_clickable(
      (By.XPATH, "//a[.//span[normalize-space()='Productos']]")
    ))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", productos_link)
    productos_link.click()

    wait.until(EC.url_contains("/products"))
    wait.until(EC.presence_of_element_located(
      (By.XPATH, "//div[contains(@class,'grid') and contains(@class,'grid-cols-')]")
    ))

    # 3) Abrir detalles de la primera card
    detail_locators = [
      (By.XPATH, "(//div[@data-slot='card'])[1]//a[contains(@href,'/products/') and @data-slot='button']"),
      (By.XPATH, "(//div[@data-slot='card'])[1]//a[contains(@href,'/products/') ]"),
      (By.XPATH, "(//div[@data-slot='card'])[1]//button[.//span[normalize-space()='Ver Detalles']]"),
      (By.XPATH, "(//div[@data-slot='card'])[1]//*[self::a or self::button][.//span[normalize-space()='Ver Detalles'] or contains(@href,'/products/')]")
    ]
    first_detail = None
    for by, sel in detail_locators:
      try:
        candidate = WebDriverWait(driver, 5).until(EC.element_to_be_clickable((by, sel)))
        first_detail = candidate
        break
      except Exception:
        continue
    if first_detail is None:
      first_detail = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href,'/products/')][1]")))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", first_detail)
    driver.execute_script("arguments[0].click();", first_detail)

    wait.until(EC.url_contains("/products/"))
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    # 4) Clic en 'Reportar producto' dentro del contenedor de acciones
    # Contenedor: div.flex.gap-3, botón con svg.lucide-flag y title="Reportar producto"
    # Usar el último contenedor de acciones y localizar el botón con svg.lucide-flag
    # Intento directo por atributo title y SVG flag, global en la página de detalles
    report_btn = None
    direct_locators = [
      (By.XPATH, "//button[@type='button' and @title='Reportar producto' and .//svg[contains(@class,'lucide-flag')]]"),
      (By.XPATH, "//button[.//svg[contains(@class,'lucide-flag')]]"),
      (By.CSS_SELECTOR, "button[title='Reportar producto']")
    ]
    for by, sel in direct_locators:
      try:
        candidate = WebDriverWait(driver, 6).until(EC.presence_of_element_located((by, sel)))
        report_btn = candidate
        break
      except Exception:
        continue

    assert report_btn is not None, "No se encontró el botón 'Reportar producto'"
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", report_btn)
    driver.execute_script("arguments[0].click();", report_btn)

    # 5) Interactuar con el modal de reporte
    # Esperar el dialog abierto con título 'Reportar Producto'
    dialog = wait.until(EC.presence_of_element_located((
      By.XPATH,
      "//div[@role='dialog' and .//h2[normalize-space()='Reportar Producto']]"
    )))

    # Abrir el select de tipo de reporte
    select_trigger = wait.until(EC.element_to_be_clickable((
      By.XPATH,
      "//div[@role='dialog']//button[@role='combobox' and @data-slot='select-trigger']"
    )))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", select_trigger)
    driver.execute_script("arguments[0].click();", select_trigger)

    # Elegir la primera opción disponible: buscar popper/portal global de Radix
    option = None
    try:
      option = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((
        By.XPATH,
        "//*[contains(@class,'content') or contains(@class,'viewport') or contains(@id,'radix')][.//*[@data-slot='select-item' or @role='option'] ]//*[@data-slot='select-item' or @role='option'][1]"
      )))
    except Exception:
      # Fallback: buscar cualquier item global de opción
      option = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((
        By.XPATH,
        "//*[@data-slot='select-item' or @role='option'][1]"
      )))
    driver.execute_script("arguments[0].click();", option)

    # Escribir comentario
    textarea = wait.until(EC.visibility_of_element_located((
      By.XPATH,
      "//div[@role='dialog']//textarea[@id='comment' or @data-slot='textarea']"
    )))
    textarea.clear()
    textarea.send_keys("Este producto incumple las políticas. Favor revisar.")

    # Botón Enviar Reporte: esperar que se habilite y hacer clic
    enviar_btn = wait.until(EC.presence_of_element_located((
      By.XPATH,
      "//div[@role='dialog']//button[normalize-space()='Enviar Reporte']"
    )))
    WebDriverWait(driver, 10).until(lambda d: enviar_btn.get_attribute('disabled') in (None, ''))
    driver.execute_script("arguments[0].click();", enviar_btn)

    # 6) Validación: esperar confirmación (toast) o cierre del modal
    try:
      WebDriverWait(driver, 6).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(normalize-space(.),'Reporte enviado') or contains(normalize-space(.),'Reporte') and contains(normalize-space(.),'enviado')]"))
      )
    except Exception:
      # Confirmar que el modal se cerró
      WebDriverWait(driver, 6).until(
        EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog' and .//h2[normalize-space()='Reportar Producto'] ]"))
      )
      time.sleep(5)  # pequeño delay adicional
# Generated by Selenium IDE

  
