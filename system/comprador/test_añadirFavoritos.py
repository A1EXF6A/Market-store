import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from selenium.webdriver.common.action_chains import ActionChains

class TestAnadirFavoritos:
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

    def test_anadir_favoritos(self):
        driver = self.driver
        wait = self.wait

        # 1) Login y dashboard
        self.login()
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # 1.1) Ir primero a Favoritos para obtener títulos existentes
        favoritos_link = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//a[.//span[normalize-space()='Favoritos']]")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", favoritos_link)
        favoritos_link.click()

        wait.until(EC.url_contains("/favorites"))
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        favoritos_iniciales = set()
        # Puede no haber favoritos aún
        try:
            favoritos_cards = driver.find_elements(By.XPATH, "//div[@data-slot='card']")
            for fc in favoritos_cards:
                try:
                    titulo = fc.find_element(By.XPATH, ".//h3").text.strip()
                    if titulo:
                        favoritos_iniciales.add(titulo)
                except Exception:
                    continue
        except Exception:
            pass
        inicial_count = len(favoritos_iniciales)

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

        # 3) Click corazón en cards que NO estén ya en favoritos (hasta 3)
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div[data-slot='card']")))
        cards = driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")
        assert len(cards) > 0, "❌ No se encontraron cards de productos"

        añadidos = set()
        objetivo = 3
        idx = 0
        # Recorremos cards hasta añadir 'objetivo' nuevos favoritos
        while idx < len(cards) and len(añadidos) < objetivo:
            # Re-obtener cards por si el DOM cambió
            cards = driver.find_elements(By.CSS_SELECTOR, "div[data-slot='card']")
            card = cards[idx]
            idx += 1

            # Obtener título del producto en el card
            try:
                titulo_el = card.find_element(By.XPATH, ".//h3")
                titulo_prod = titulo_el.text.strip()
            except Exception:
                continue

            # Saltar si ya está en favoritos o ya lo añadimos en este test
            if not titulo_prod or titulo_prod in favoritos_iniciales or titulo_prod in añadidos:
                continue

            try:
                # Buscar el botón corazón dentro del card (variante 1: por svg)
                heart_btn = card.find_element(
                    By.XPATH,
                    ".//button[@type='button' and .//svg[contains(@class,'lucide-heart')]]"
                )
            except Exception:
                try:
                    # Variante 2: botón absoluto en esquina superior derecha
                    heart_btn = card.find_element(
                        By.XPATH,
                        ".//div[contains(@class,'relative')]//button[@type='button' and contains(@class,'absolute') and contains(@class,'top-3') and contains(@class,'right-3')]"
                    )
                except Exception as e_inner:
                    print(f"⚠ No se ubicó botón corazón en '{titulo_prod}': {e_inner}")
                    continue

            try:
                # Realizar el click (común para ambos casos)
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", heart_btn)
                driver.execute_script("arguments[0].click();", heart_btn)

                # Confirmar con toast; si no aparece, usar Actions como fallback
                try:
                    WebDriverWait(driver, 4).until(
                        EC.presence_of_element_located((By.XPATH, "//*[contains(normalize-space(),'Favorito actualizado')]"))
                    )
                except Exception:
                    ActionChains(driver).move_to_element(card).move_to_element(heart_btn).pause(0.1).click().perform()
                    WebDriverWait(driver, 6).until(
                        EC.presence_of_element_located((By.XPATH, "//*[contains(normalize-space(),'Favorito actualizado')]"))
                    )

                añadidos.add(titulo_prod)
            except Exception as e:
                print(f"⚠ No se pudo añadir favorito para '{titulo_prod}': {e}")
                continue

        # 4) Ir a Favoritos
        favoritos_link = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//a[.//span[normalize-space()='Favoritos']]")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", favoritos_link)
        favoritos_link.click()

        # 5) Validación: página cargada y los títulos añadidos aparecen en favoritos
        wait.until(EC.url_contains("/favorites"))
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        # Esperar a que estén presentes los títulos añadidos
        if not añadidos:
            raise AssertionError("❌ No se pudo añadir ningún favorito nuevo (todos ya estaban en favoritos?)")

        # Esperar a que el conteo total aumente acorde a lo añadido
        target = inicial_count + len(añadidos)
        try:
            WebDriverWait(driver, 12).until(lambda d: len(d.find_elements(By.XPATH, "//div[@data-slot='card']")) >= target)
        except Exception:
            current = len(driver.find_elements(By.XPATH, "//div[@data-slot='card']"))
            assert current >= target, f"❌ Conteo de favoritos ({current}) no alcanzó el esperado ({target})"

        # Log informativo de añadidos
        print(f"✅ Añadidos a favoritos: {sorted(list(añadidos))}")

        # Asegurar navegación final estable a Favoritos antes de terminar
        try:
            favoritos_link = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//a[.//span[normalize-space()='Favoritos']]")
            ))
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", favoritos_link)
            favoritos_link.click()
            wait.until(EC.url_contains("/favorites"))
        except Exception:
            pass

        assert "/favorites" in driver.current_url, f"URL final inesperada: {driver.current_url}"
