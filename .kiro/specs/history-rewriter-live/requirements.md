# Requirements Document

## Introduction

History Rewriter Live to interaktywna aplikacja webowa w stylu Awwwards, która pozwala użytkownikom proponować alternatywne scenariusze historyczne. AI generuje kinematograficzne mapy, timeline'y, narrację i ilustracje w czasie rzeczywistym. Aplikacja łączy zaawansowane animacje 3D, generatywną sztuczną inteligencję i immersyjne doświadczenie użytkownika.

## Requirements

### Requirement 1

**User Story:** Jako użytkownik, chcę zobaczyć spektakularny intro screen, żeby od razu poczuć klimat aplikacji i zrozumieć jej cel.

#### Acceptance Criteria

1. WHEN aplikacja się ładuje THEN system SHALL wyświetlić pełnoekranowe czarne tło z wycentrowanym tekstem
2. WHEN intro się rozpoczyna THEN system SHALL pokazać fade-in animację tekstu "History is written by the victors... but what if you could change it?"
3. WHEN minie 2 sekundy THEN system SHALL przejść płynnie do widoku AnimatedMap z nakładką input box

### Requirement 2

**User Story:** Jako użytkownik, chcę móc wprowadzić swój scenariusz "co by było gdyby", żeby rozpocząć generowanie alternatywnej historii.

#### Acceptance Criteria

1. WHEN pojawi się input prompt THEN system SHALL wyświetlić duże, wycentrowane pole tekstowe z placeholder "What if..."
2. WHEN użytkownik widzi input THEN system SHALL pokazać 3 klikalne przykładowe prompty ("Napoleon wins at Waterloo", "Roman Empire never falls", "Cold War turns hot in 1962")
3. WHEN użytkownik kliknie przykład THEN system SHALL wypełnić input tym tekstem
4. WHEN użytkownik zatwierdzi prompt THEN system SHALL ukryć input, wysłać POST do /api/rewrite-history i uruchomić sekwencję animacji

### Requirement 3

**User Story:** Jako użytkownik, chcę zobaczyć animowaną mapę świata, która morfuje się zgodnie z alternatywną historią, żeby wizualnie doświadczyć zmian.

#### Acceptance Criteria

1. WHEN mapa się ładuje THEN system SHALL wyrenderować kontur świata z GeoJSON w czarno-białej kolorystyce z subtelnym 3D tilt
2. WHEN otrzyma dane geoChanges z LLM THEN system SHALL animować morfowanie granic używając D3 transitions
3. WHEN timeline event zostanie podświetlony THEN system SHALL przybliżyć kamerę do odpowiednich geoPoints
4. WHEN użytkownik wchodzi w interakcję THEN system SHALL umożliwić OrbitControls do manipulacji widokiem

### Requirement 4

**User Story:** Jako użytkownik, chcę widzieć timeline wydarzeń, który synchronizuje się z narracją, żeby śledzić chronologię alternatywnej historii.

#### Acceptance Criteria

1. WHEN timeline się ładuje THEN system SHALL wyświetlić pionowy timeline po lewej stronie ekranu
2. WHEN narracja osiągnie konkretne wydarzenie THEN system SHALL podświetlić odpowiedni punkt na timeline
3. WHEN wydarzenie zostanie podświetlone THEN system SHALL uruchomić animację GSAP reveal
4. WHEN użytkownik kliknie na wydarzenie THEN system SHALL przeskoczyć do odpowiedniego momentu narracji

### Requirement 5

**User Story:** Jako użytkownik, chcę słuchać kinematograficznej narracji z napisami, żeby w pełni zanurzyć się w alternatywnej historii.

#### Acceptance Criteria

1. WHEN narracja się rozpoczyna THEN system SHALL pobrać audio z /api/narrate
2. WHEN audio się odtwarza THEN system SHALL wyświetlać zsynchronizowane napisy
3. WHEN narracja osiągnie punkt timeline THEN system SHALL podświetlić odpowiednie wydarzenie
4. WHEN użytkownik zatrzyma audio THEN system SHALL zatrzymać wszystkie synchronizowane animacje

### Requirement 6

**User Story:** Jako developer, chcę mieć backend API, które integruje się z AI services, żeby generować dane dla frontendu.

#### Acceptance Criteria

1. WHEN otrzyma POST na /api/rewrite-history THEN system SHALL wywołać LLM z promptem użytkownika
2. WHEN LLM zwróci dane THEN system SHALL zwrócić JSON z summary, timeline i geoChanges
3. WHEN otrzyma POST na /api/narrate THEN system SHALL wywołać TTS service
4. WHEN TTS zwróci audio THEN system SHALL zwrócić URL do pliku audio

### Requirement 7

**User Story:** Jako użytkownik, chcę mieć płynne, kinematograficzne animacje, żeby doświadczenie było na poziomie Awwwards.

#### Acceptance Criteria

1. WHEN jakakolwiek animacja się rozpoczyna THEN system SHALL używać GSAP do smooth transitions
2. WHEN mapa się morfuje THEN system SHALL używać D3 transitions z easing functions
3. WHEN kamera się porusza THEN system SHALL używać Three.js smooth camera movements
4. WHEN elementy UI się pojawiają THEN system SHALL używać staggered animations

### Requirement 8

**User Story:** Jako użytkownik, chcę mieć responsywny design, żeby aplikacja działała na różnych urządzeniach.

#### Acceptance Criteria

1. WHEN aplikacja ładuje się na desktop THEN system SHALL wyświetlić pełny layout z mapą, timeline i narracją
2. WHEN aplikacja ładuje się na mobile THEN system SHALL dostosować layout do pionowego ekranu
3. WHEN użytkownik zmienia orientację THEN system SHALL płynnie dostosować interfejs
4. WHEN ekran jest mały THEN system SHALL ukryć mniej istotne elementy UI