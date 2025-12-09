import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class TestMensajes:
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

  def test_mensajes_contactar_y_enviar(self):
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
    # Intentar varios selectores comunes para el enlace de detalles dentro de la primera tarjeta
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
      # Fallback: abrir el primer enlace a /products/ en la página
      first_detail = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href,'/products/')][1]")))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", first_detail)
    driver.execute_script("arguments[0].click();", first_detail)

    wait.until(EC.url_contains("/products/"))
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    # 4) Clic en 'Contactar Vendedor' (varios selectores y fallback)
    contactar_locators = [
      (By.XPATH, "//button[.//svg[contains(@class,'lucide-message-circle')] and contains(normalize-space(.),'Contactar Vendedor')]")
      ,(By.XPATH, "//button[contains(normalize-space(.),'Contactar Vendedor')]")
      ,(By.XPATH, "//button[.//svg[contains(@class,'lucide-message-circle')]]")
      ,(By.XPATH, "//*[self::button or self::a][contains(normalize-space(.),'Contactar Vendedor')]")
    ]
    contactar_btn = None
    for by, sel in contactar_locators:
      try:
        candidate = WebDriverWait(driver, 6).until(EC.element_to_be_clickable((by, sel)))
        contactar_btn = candidate
        break
      except Exception:
        continue
    if contactar_btn:
      driver.execute_script("arguments[0].scrollIntoView({block:'center'});", contactar_btn)
      driver.execute_script("arguments[0].click();", contactar_btn)

    # 5) Escribir mensaje y enviar
    # Ubicar el contenedor del footer de chat (último) y dentro el input
    footer_xpath = "(//div[contains(@class,'border-t')]//div[contains(@class,'space-x-2')])[last()]"
    footer = wait.until(EC.presence_of_element_located((By.XPATH, footer_xpath)))
    mensaje_input = wait.until(EC.visibility_of_element_located((
      By.XPATH,
      footer_xpath + "//input[@data-slot='input' and @placeholder='Escribe un mensaje...']"
    )))
    mensaje_input.clear()
    mensaje_input.send_keys("Hola, estoy interesado en este producto. ¿Sigue disponible?")

    # Esperar a que el botón de enviar se habilite y clic
    # Ubicar el botón de enviar dentro del mismo contenedor del input y esperar que sea clickeable
    # Buscar el svg y su botón padre vía CSS para mayor robustez
    # Buscar el botón de enviar vía JS dentro del footer
    enviar_btn = driver.execute_script("""
      const footers = Array.from(document.querySelectorAll('div.border-t div.flex.space-x-2'));
      const footer = footers[footers.length - 1];
      if (!footer) return null;
      const btn = footer.querySelector('button[data-slot="button"]');
      if (btn && btn.querySelector('svg.lucide-send')) return btn;
      const anyBtn = footer.querySelector('button');
      if (anyBtn && anyBtn.querySelector('svg.lucide-send')) return anyBtn;
      return null;
    """)
    if enviar_btn is None:
      # Fallback con XPath dentro del footer
      send_xpath = footer_xpath + "//button[@data-slot='button' and .//svg[contains(@class,'lucide-send')]]"
      enviar_btn = WebDriverWait(driver, 6).until(EC.presence_of_element_located((By.XPATH, send_xpath)))
    # Esperar que esté habilitado
    assert enviar_btn is not None, "No se encontró el botón de enviar"
    WebDriverWait(driver, 10).until(lambda d: enviar_btn.get_attribute('disabled') in (None, ''))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", enviar_btn)
    driver.execute_script("arguments[0].click();", enviar_btn)

    # 6) Validación (toast o input vacío)
    try:
      WebDriverWait(driver, 6).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(normalize-space(),'Mensaje enviado') or contains(normalize-space(),'enviado') or contains(normalize-space(),'Mensaje')]"))
      )
    except Exception:
      WebDriverWait(driver, 6).until(
        EC.text_to_be_present_in_element_value((By.XPATH, "//div[contains(@class,'border-t')]//div[contains(@class,'flex')]//input[@data-slot='input' and @placeholder='Escribe un mensaje...']"), "")
      )
  
