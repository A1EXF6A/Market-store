import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains


class TestQuitarFavoritos:
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

  def test_quitar_favoritos(self):
    driver = self.driver
    wait = self.wait

    # 1) Login y dashboard
    self.login()
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    # 2) Ir a Favoritos con el botón del dashboard
    fav_link = wait.until(EC.element_to_be_clickable((
      By.XPATH,
      "//a[@href='/favorites' and .//span[normalize-space()='Favoritos']]"
    )))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", fav_link)
    fav_link.click()

    wait.until(EC.url_contains("/favorites"))
    wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class,'grid') and contains(@class,'grid-cols-')]|//div[contains(@class,'grid') and contains(@class,'gap-6')]")))

    # 3) Contar favoritos iniciales
    inicial_cards = driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")
    inicial_count = len(inicial_cards)
    assert inicial_count >= 1, "❌ No hay elementos en favoritos para eliminar"

    # 4) Quitar favoritos clicando el botón en esquina superior derecha de cada card
    removidos = 0
    for idx in range(inicial_count):
      # Re-obtener cards para evitar staleness
      cards = driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")
      if not cards:
        break
      card = cards[0]  # siempre tomamos el primero visible

      # Intentar obtener el título (para logging)
      try:
        titulo = card.find_element(By.XPATH, ".//div[@data-slot='card-title' or self::h3]").text.strip()
      except Exception:
        titulo = f"card-{idx+1}"

      # Localizar botón de 'quitar' (heart-off)
      try:
        heart_off_btn = card.find_element(By.XPATH, 
          ".//button[@type='button' and .//svg[contains(@class,'lucide-heart-off')]]"
        )
      except Exception:
        try:
          heart_off_btn = card.find_element(By.XPATH,
            ".//button[@type='button' and contains(@class,'absolute') and contains(@class,'top') and contains(@class,'right')]"
          )
        except Exception as e:
          print(f"⚠ No se encontró botón quitar favorito en '{titulo}': {e}")
          continue

      driver.execute_script("arguments[0].scrollIntoView({block:'center'});", heart_off_btn)
      # Click JS para evitar intercepts
      driver.execute_script("arguments[0].click();", heart_off_btn)

      # Confirmación: esperar toast o que disminuya el conteo
      toast_ok = True
      try:
        WebDriverWait(driver, 4).until(
          EC.presence_of_element_located((By.XPATH, "//*[contains(normalize-space(),'Favorito actualizado')]"))
        )
      except Exception:
        toast_ok = False

      # Esperar a que el número de cards disminuya
      prev_count = len(driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']"))
      try:
        WebDriverWait(driver, 7).until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")) < prev_count)
      except Exception:
        # Reintento suave: re-buscar botón y hacer otro JS click si aún existe
        try:
          card_refetch = driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")
          if card_refetch:
            btn_retry = card_refetch[0].find_element(By.XPATH,
              ".//button[@type='button' and .//svg[contains(@class,'lucide-heart-off')]]"
            )
            driver.execute_script("arguments[0].click();", btn_retry)
            WebDriverWait(driver, 5).until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")) < prev_count)
        except Exception:
          pass

      # Actualizar removidos si efectivamente disminuyó el conteo
      new_count = len(driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']"))
      if new_count < prev_count:
        removidos += 1

    # 5) Validar que disminuyó el conteo
    time.sleep(1)
    final_cards = driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")
    final_count = len(final_cards)
    assert final_count < inicial_count, \
      f"❌ Los favoritos no disminuyeron: inicial={inicial_count}, final={final_count}"

    print(f"✅ Quitados de favoritos: {removidos}; restante: {final_count}")
  
