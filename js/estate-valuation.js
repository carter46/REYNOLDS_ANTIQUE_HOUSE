(function () {
  "use strict";

  function interestWrappers(form) {
    return form.querySelectorAll('[data-hook="box-selection-option-wrapper"]');
  }

  function syncInterestUi(wrapper) {
    var input = wrapper.querySelector('input[type="checkbox"]');
    if (!input) return;
    wrapper.setAttribute("data-checked", input.checked ? "true" : "false");
  }

  function wireInterestToggles(form) {
    interestWrappers(form).forEach(function (wrapper) {
      var input = wrapper.querySelector('input[type="checkbox"]');
      if (!input) return;
      syncInterestUi(wrapper);
      wrapper.addEventListener("click", function (e) {
        if (e.target === input) {
          syncInterestUi(wrapper);
          return;
        }
        e.preventDefault();
        input.checked = !input.checked;
        syncInterestUi(wrapper);
      });
    });
  }

  function wireNamedCheckboxes(form) {
    var referral = form.querySelector("#checkbox-9948");
    if (referral && !referral.getAttribute("name")) {
      referral.setAttribute("name", "referral_partner");
      referral.value = "1";
    }
    var news = form.querySelector("#checkbox-9951");
    if (news && !news.getAttribute("name")) {
      news.setAttribute("name", "newsletter_optin");
      news.value = "1";
    }
  }

  function setStatus(el, message, isError) {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.className = "rah-valuation-status" + (isError ? " is-error" : message ? " is-success" : "");
  }

  function setSubmitting(btn, busy) {
    if (!btn) return;
    btn.disabled = !!busy;
    btn.value = busy ? "Sending…" : "Submit";
  }

  function validate(form) {
    var email = (form.email && form.email.value || "").trim();
    var first = (form.first_name && form.first_name.value || "").trim();
    var last = (form.last_name && form.last_name.value || "").trim();
    if (!email || !first || !last) {
      return "Please provide your first name, last name, and email.";
    }
    var interestNames = [
      "selling",
      "consigning",
      "auctioning",
      "jewelry",
      "schedule",
      "referral",
      "press",
      "other"
    ];
    var any = interestNames.some(function (name) {
      var el = form.elements.namedItem(name);
      return el && el.checked;
    });
    if (!any) {
      return "Please select at least one interest.";
    }
    var files = form.querySelector("#my_file");
    if (files && files.files && files.files.length > 10) {
      return "Please upload up to ten images.";
    }
    return "";
  }

  function init() {
    var form = document.getElementById("estate_service_form");
    if (!form || form.getAttribute("data-rah-valuation-ready") === "1") return;
    form.setAttribute("data-rah-valuation-ready", "1");
    form.setAttribute("action", "/valuation.php");
    form.setAttribute("method", "POST");
    form.setAttribute("enctype", "multipart/form-data");
    form.setAttribute("novalidate", "novalidate");

    wireNamedCheckboxes(form);
    wireInterestToggles(form);

    if (!form.querySelector('input[name="website"]')) {
      var hp = document.createElement("input");
      hp.type = "text";
      hp.name = "website";
      hp.value = "";
      hp.tabIndex = -1;
      hp.autocomplete = "off";
      hp.setAttribute("aria-hidden", "true");
      hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;";
      form.appendChild(hp);
    }

    var status = document.getElementById("rah-valuation-status");
    if (!status) {
      status = document.createElement("p");
      status.id = "rah-valuation-status";
      status.className = "rah-valuation-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.hidden = true;
      var submitWrap = form.querySelector('[data-hook="submit-button"]');
      if (submitWrap && submitWrap.parentNode) {
        submitWrap.parentNode.insertBefore(status, submitWrap.nextSibling);
      } else {
        form.appendChild(status);
      }
    }

    var submitBtn = form.querySelector('input[name="submit_btn"], [data-hook="submit-button"]');
    if (submitBtn) {
      submitBtn.removeAttribute("onclick");
      if (submitBtn.type === "button") {
        submitBtn.type = "submit";
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus(status, "", false);

      var err = validate(form);
      if (err) {
        setStatus(status, err, true);
        return;
      }

      var fd = new FormData(form);
      fd.set("page_url", window.location.href);

      setSubmitting(submitBtn, true);
      fetch("/valuation.php", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          return res.json().catch(function () {
            return {};
          }).then(function (data) {
            return { res: res, data: data };
          });
        })
        .then(function (result) {
          if (result.res.ok && result.data && result.data.ok) {
            form.reset();
            interestWrappers(form).forEach(syncInterestUi);
            setStatus(
              status,
              "Thank you. Your valuation request was sent. A specialist will follow up within one business day.",
              false
            );
          } else {
            setStatus(
              status,
              (result.data && result.data.error) ||
                "Unable to send your valuation request right now. Please try again later.",
              true
            );
          }
        })
        .catch(function () {
          setStatus(
            status,
            "Unable to send your valuation request right now. Please try again later.",
            true
          );
        })
        .finally(function () {
          setSubmitting(submitBtn, false);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
