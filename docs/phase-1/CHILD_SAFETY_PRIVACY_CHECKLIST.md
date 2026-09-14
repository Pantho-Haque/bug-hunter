---
meta:
  contentType: Checklist
  phase: 1
  status: Proposed baseline
---

# Protect children and local data

Use this checklist during product review, implementation readiness, moderated playtests, and release. A checked item needs linked evidence. This checklist does not replace jurisdiction-specific legal advice.

## Product and identity

- [ ] The game starts without an account, email address, phone number, age field, or social identity.
- [ ] Avatar identity uses approved presets and preset call signs only.
- [ ] No child real name, school, location, face, voice, contact detail, or free-text profile is requested or stored.
- [ ] There is no chat, messaging, public profile, public sharing, leaderboard, or named comparison.
- [ ] There are no ads, purchases, premium currency, random rewards, streaks, countdown pressure, or dark patterns.
- [ ] Boy and girl presentation presets have identical mechanics, collision, speed, reach, and rewards.

## Data and network

- [ ] Settings, progress, level code, and one recovery snapshot are the only planned player records.
- [ ] Each record has a documented field purpose, version, retention rule, and recovery behavior.
- [ ] The product creates no analytics identifier and sends no learner code or progress to a remote service.
- [ ] Learner code has no network, DOM, storage, navigation, clipboard, device, popup, or parent-window capability.
- [ ] Dependencies, fonts, assets, narration, and mission content are packaged for the offline promise.
- [ ] Any unexpected network request fails a release test.
- [ ] Export is initiated by the user, names its contents, and contains no hidden identifier.
- [ ] Import previews changes and validates fully before replacing local state.
- [ ] Clear Data names the records removed and requires confirmation.
- [ ] A storage or migration failure preserves the last valid and recovery snapshots where possible.

## Child-facing experience

- [ ] Failure feedback describes the observed result and one safe next action without shame, damage, or ridicule.
- [ ] Required goals are never gated by payment, time, perfect collection, or social performance.
- [ ] Hints never modify code without the child's explicit action and are never punished.
- [ ] Celebrations are brief, skippable, and do not auto-start another mission.
- [ ] The game permits pause, exit, replay, and return without loss or guilt language.
- [ ] Violence, crime, weapons, death, traffic danger, and unrestricted-city themes remain outside v1.
- [ ] Optional rewards are cosmetic, story-based, or creative and provide no gameplay advantage.

## Accessibility and sensory safety

- [ ] Every required action is keyboard operable and has a visible focus indicator.
- [ ] Touch controls meet the target-size requirement and do not require fine motor precision.
- [ ] Canvas-only information has a semantic text equivalent and logical reading order.
- [ ] Status is not conveyed by color, sound, animation, or location alone.
- [ ] Text scales to 200 percent without clipped controls or lost mission context.
- [ ] Reduced-motion mode preserves order and meaning without camera travel or strong effects.
- [ ] Music, effects, and narration have independent controls.
- [ ] No effect flashes more than three times per second.
- [ ] Errors and dynamic status use a centralized, non-spamming announcement strategy.
- [ ] Screen-reader and keyboard testing supplements automated accessibility checks.

## Moderated research sessions

- [ ] A privacy or legal reviewer approves the country-specific adult-permission and child-assent process before recruitment.
- [ ] The child and adult understand that participation is optional and may stop at any time.
- [ ] The facilitator does not ask for information unrelated to the study.
- [ ] Observation uses a participant code stored outside the game rather than a name in product data.
- [ ] Recording is off by default and requires separate documented permission where used.
- [ ] The protocol defines who may access notes or recordings, where they are stored, and when they are deleted.
- [ ] Reports aggregate observations and remove identifying detail.
- [ ] A safeguarding escalation contact and stop-session rule are available to the facilitator.
- [ ] The facilitator records assistance without coaching the solution unless the session is stopped for distress or accessibility.

## Public-launch blockers

- [ ] DR-06 names every launch country.
- [ ] A qualified reviewer maps applicable child privacy, consumer, accessibility, and education requirements.
- [ ] Product notices, parent or teacher information, asset licences, and support routes are approved.
- [ ] The built application is verified to make no accidental or undocumented network request.
- [ ] Every Must requirement has evidence on supported devices.

If any product-identity, learner-code capability, moderated-research, or public-launch item fails, stop the affected activity and create a decision or defect record before continuing.

