// quiz-generator.js - Quiz Generation Engine (File Parsing, Topic Database, Heuristic & AI Generation)

class QuizGenerator {
  constructor() {
    this.currentPages = [[], [], []]; // 3 pages of 5 questions each
    this.activePageIndex = 0;
  }

  // Pre-built curated knowledge bank for Korean Adult / Senior Learners
  static get KNOWLEDGE_BANK() {
    return {
      '스마트폰': [
        {
          question: "스마트폰 화면을 두 손가락으로 벌리면 어떤 기능이 실행될까요?",
          options: ["화면 확대하기", "화면 끄기", "소리 줄이기", "사진 삭제하기"],
          correctIndex: 0,
          explanation: "두 손가락을 모았다가 벌리는 동작(핀치 줌)은 글자나 사진을 크게 확대할 때 사용합니다.",
          type: "choice",
          category: "스마트폰 기초"
        },
        {
          question: "카카오톡에서 잘못 보낸 메시지는 몇 분 이내에 삭제해야 '모든 대화상대에게 삭제'가 가능할까요?",
          options: ["5분 이내", "1시간 이내", "24시간 이내", "시간 제한 없음"],
          correctIndex: 0,
          explanation: "카카오톡 메시지는 보낸 지 5분 이내여야 상대방 화면에서도 지울 수 있습니다.",
          type: "choice",
          category: "스마트폰 활용"
        },
        {
          question: "스마트폰 배터리를 오래 쓰려면 0%까지 완전히 방전시킨 후 충전하는 것이 좋다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 1,
          explanation: "최신 리튬이온 배터리는 방전되기 전 20%~80% 사이에서 자주 충전하는 것이 수명에 좋습니다.",
          type: "ox",
          category: "스마트폰 상식"
        },
        {
          question: "출처를 알 수 없는 문자메시지에 적힌 인터넷 링크(URL)는 누르지 않는 것이 안전하다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "스미싱 사기 피해를 예방하기 위해 모르는 번호의 웹 링크는 절대 누르지 마세요.",
          type: "ox",
          category: "디지털 안전"
        },
        {
          question: "스마트폰 화면 상단을 손가락으로 쓸어내리면 나타나는 빠른 설정 창에서 켤 수 없는 기능은?",
          options: ["와이파이(Wi-Fi)", "화면 밝기 조절", "손전등(플래시)", "전자레인지 켜기"],
          correctIndex: 3,
          explanation: "상단 빠른 설정 창에서는 와이파이, 소리, 손전등, 비행기탑승모드 등을 빠르게 켤 수 있습니다.",
          type: "choice",
          category: "스마트폰 기초"
        },
        {
          question: "인터넷 와이파이(Wi-Fi) 아이콘 옆에 자물쇠 모양이 그려져 있다면 무엇을 뜻할까요?",
          options: ["비밀번호를 입력해야 접속 가능", "접속이 고장 난 상태", "무료 공공 와이파이", "배터리가 부족함"],
          correctIndex: 0,
          explanation: "자물쇠 표시는 보안이 설정되어 있어 암호를 입력해야 연결되는 와이파이입니다.",
          type: "choice",
          category: "인터넷 상식"
        },
        {
          question: "카카오톡에서 친구에게 받은 예쁜 꽃 사진을 내 스마트폰 앨범에 저장하려면 사진을 길게 누르거나 다운로드 버튼을 누르면 된다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "사진을 터치한 후 하단의 묶음저장 또는 내려받기 아이콘을 누르면 갤러리에 저장됩니다.",
          type: "ox",
          category: "스마트폰 활용"
        },
        {
          question: "스마트폰에서 글씨 크기를 키우고 싶을 때 들어가야 하는 기본 메뉴는?",
          options: ["설정 > 디스플레이(화면)", "계산기", "카메라", "날씨"],
          correctIndex: 0,
          explanation: "[설정] - [디스플레이] - [글자 크기와 스타일]에서 글씨를 원하는 만큼 크게 키울 수 있습니다.",
          type: "choice",
          category: "스마트폰 설정"
        },
        {
          question: "보이스피싱 의심 전화를 받았을 때 즉시 신고하고 상담할 수 있는 경찰청 전화번호는?",
          options: ["112", "114", "119", "113"],
          correctIndex: 0,
          explanation: "보이스피싱 피해 발생 또는 의심 신고는 경찰청 112나 금융감독원 1332로 연락하세요.",
          type: "choice",
          category: "디지털 안전"
        },
        {
          question: "스마트폰 화면이 갑자기 멈추었을 때 전원 버튼과 볼륨 아래 버튼을 7초 이상 길게 누르면 강제 재부팅이 된다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "전원 버튼과 음량(하) 버튼을 길게 누르면 먹통이 된 스마트폰을 안전하게 다시 켤 수 있습니다.",
          type: "ox",
          category: "스마트폰 상식"
        },
        {
          question: "유튜브에서 지난 영상을 다시 보거나 내가 구독한 채널을 찾을 때 화면 맨 아래 어디를 누르면 될까요?",
          options: ["보관함 (또는 구독)", "전원 끄기", "비행기 모드", "블루투스"],
          correctIndex: 0,
          explanation: "유튜브 하단의 '구독'이나 '보관함(내 페이지)'을 누르면 내가 즐겨보는 채널을 바로 볼 수 있습니다.",
          type: "choice",
          category: "앱 활용"
        },
        {
          question: "스마트폰으로 병원 진료나 KTX 기차표를 예매할 때 신분증 없이 앱 하나로 본인인증을 도와주는 것은?",
          options: ["PASS 또는 카카오/네이버 인증서", "만보기 앱", "지하철 노선도", "음악 재생기"],
          correctIndex: 0,
          explanation: "민간 인증서(PASS, 카카오, 네이버, 토스)를 사용하면 복잡한 서류 없이 간편하게 본인확인이 됩니다.",
          type: "choice",
          category: "스마트폰 활용"
        },
        {
          question: "지하철이나 버스에서 이어폰 없이 큰 소리로 동영상을 볼 때는 볼륨을 0으로 하거나 이어폰을 착용해야 한다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "대중교통 이용 시에는 주변 승객을 배려하여 이어폰을 착용하는 것이 올바른 예절입니다.",
          type: "ox",
          category: "디지털 에티켓"
        },
        {
          question: "스마트폰 카메라로 가게의 사각형 QR코드를 비추면 메뉴판이나 웹사이트가 바로 열린다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "기본 카메라를 켜고 QR코드에 가져다 대면 상단에 연결 링크가 바로 나타납니다.",
          type: "ox",
          category: "스마트폰 활용"
        },
        {
          question: "전화 통화 중에 상대방의 목소리가 너무 작게 들린다면 통화 중에 스마트폰 옆면의 어느 버튼을 눌러야 할까요?",
          options: ["볼륨 올리기(위쪽) 버튼", "전원 끄기 버튼", "카메라 셔터", "홈 버튼"],
          correctIndex: 0,
          explanation: "통화 중에 측면의 볼륨 위쪽 버튼을 누르면 상대방 통화 수화음 음량이 커집니다.",
          type: "choice",
          category: "스마트폰 기초"
        }
      ],

      '건강상식': [
        {
          question: "하루에 권장되는 성인의 표준 물 섭취량은 대략 몇 리터(L) 정도일까요?",
          options: ["약 1.5 ~ 2리터 (7~8잔)", "약 10리터", "약 200ml (반 잔)", "물을 마실 필요 없다"],
          correctIndex: 0,
          explanation: "체내 수분 밸런스와 혈액 순환을 위해 하루 1.5~2L 정도의 미온수를 자주 나누어 마시는 것이 좋습니다.",
          type: "choice",
          category: "건강 상식"
        },
        {
          question: "혈압을 측정할 때는 커피나 담배를 피우고 바로 측정하는 것이 더 정확하다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 1,
          explanation: "카페인이나 니코틴은 혈압을 일시적으로 올리므로 측정 전 30분 동안은 피하고 안정된 상태에서 재야 합니다.",
          type: "ox",
          category: "건강 관리"
        },
        {
          question: "식사 후 바로 눕는 습관이 지속되면 어떤 질환에 걸리기 쉬울까요?",
          options: ["역류성 식도염", "동결견(오십견)", "이명", "백내장"],
          correctIndex: 0,
          explanation: "식후 바로 누우면 위산이 식도로 역류하여 속쓰림과 역류성 식도염을 유발할 수 있습니다.",
          type: "choice",
          category: "생활 습관"
        },
        {
          question: "뼈를 튼튼하게 하고 골다공증을 예방하기 위해 햇볕을 쬐면 몸속에서 합성되는 비타민은?",
          options: ["비타민 D", "비타민 C", "비타민 A", "비타민 B12"],
          correctIndex: 0,
          explanation: "햇볕을 받으면 체내에서 칼슘 흡수를 돕는 비타민 D가 자연스럽게 생성됩니다.",
          type: "choice",
          category: "영양 상식"
        },
        {
          question: "체온이 1도 올라가면 면역력이 높아지고 혈액순환에 도움이 된다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "적절한 온열 요법과 따뜻한 물 섭취, 가벼운 운동은 체온을 유지해 면역력을 높여줍니다.",
          type: "ox",
          category: "건강 상식"
        },
        {
          question: "걷기 운동을 할 때 바른 자세로 알맞은 것은?",
          options: ["허리를 펴고 시선은 10~15m 앞을 본다", "땅만 쳐다보고 걷는다", "팔을 전혀 흔들지 않는다", "뒤꿈치보다 발가락부터 딛는다"],
          correctIndex: 0,
          explanation: "시선은 정면을 보고 어깨와 가슴을 펴며, 발뒤꿈치부터 닿는 3박자 보행이 관절에 좋습니다.",
          type: "choice",
          category: "운동 상식"
        },
        {
          question: "달걀노른자는 콜레스테롤이 많아 하루에 한 개도 먹으면 안 된다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 1,
          explanation: "달걀노른자에는 레시틴과 루테인 등 좋은 영양소가 많아 하루 1~2개 섭취는 건강에 유익합니다.",
          type: "ox",
          category: "영양 상식"
        },
        {
          question: "눈 건강과 노안 예방에 도움을 주는 대표적인 영양 성분은?",
          options: ["루테인 & 지아잔틴", "탄산가스", "나트륨", "설탕"],
          correctIndex: 0,
          explanation: "루테인과 지아잔틴은 황반을 보호하고 눈의 피로도를 낮추는 데 큰 도움을 줍니다.",
          type: "choice",
          category: "건강 상식"
        },
        {
          question: "밤에 잠이 잘 오지 않을 때는 따뜻한 우유를 마시거나 가벼운 스트레칭을 하는 것이 도움이 된다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "따뜻한 우유 속 트립토판 성분은 수면 호르몬인 멜라토닌 생성을 도와 숙면을 유도합니다.",
          type: "ox",
          category: "생활 습관"
        },
        {
          question: "고혈압 환자는 국이나 찌개의 국물까지 남김없이 다 마시는 것이 좋다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 1,
          explanation: "국물에는 나트륨(소금)이 많이 녹아 있으므로 건더기 위주로 드시는 것이 혈압 조절에 좋습니다.",
          type: "ox",
          category: "식습관"
        },
        {
          question: "어르신 근육량 감소(근감소증)를 막기 위해 매 끼니 꼭 챙겨 먹어야 하는 영양소는?",
          options: ["단백질 (두부, 생선, 살코기, 달걀)", "탄산음료", "설탕 과자", "기름진 튀김"],
          correctIndex: 0,
          explanation: "근육 유지를 위해 콩류, 계란, 두부, 살코기 등 양질의 단백질을 꾸준히 섭취해야 합니다.",
          type: "choice",
          category: "영양 상식"
        },
        {
          question: "치아 건강을 위해 양치질은 하루 3번, 식후 3분 이내, 3분 동안 하는 3·3·3 법칙이 권장된다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "규칙적인 양치질과 치간칫솔 사용은 잇몸병과 충치 예방의 기본입니다.",
          type: "ox",
          category: "치아 건강"
        },
        {
          question: "감기에 걸렸을 때 항생제는 의사의 처방 없이 약국에서 마음대로 사 먹을 수 있다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 1,
          explanation: "항생제는 세균 감염 시 의사의 정확한 진단과 처방을 받아 복용해야 오남용을 막을 수 있습니다.",
          type: "ox",
          category: "의약 상식"
        },
        {
          question: "환절기에 뇌졸중(중풍)의 초기 의심 증상으로 거리가 먼 것은?",
          options: ["한쪽 팔다리 마비 및 어눌한 말투", "갑작스러운 시야 장애", "한쪽 입꼬리 처짐", "식욕이 왕성해짐"],
          correctIndex: 3,
          explanation: "한쪽 마비, 말 어눌함, 시야 흐림 등 '이웃손발(FAST)' 증상이 나타나면 즉시 119를 불러야 합니다.",
          type: "choice",
          category: "응급 상식"
        },
        {
          question: "스트레스를 받을 때 크게 심호흡을 3~5회 천천히 하면 자율신경계가 안정된다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "느리고 깊은 복식호흡은 부교감신경을 활성화시켜 마음을 차분하게 가라앉혀 줍니다.",
          type: "ox",
          category: "마음 건강"
        }
      ],

      '역사문화': [
        {
          question: "조선시대 세종대왕이 백성들을 위해 창제하신 우리나라 고유의 문자는?",
          options: ["훈민정음 (한글)", "한자", "이두", "로마자"],
          correctIndex: 0,
          explanation: "1443년 세종대왕께서 백성 누구나 쉽게 배울 수 있도록 훈민정음을 창제하셨습니다.",
          type: "choice",
          category: "한국 역사"
        },
        {
          question: "임진왜란 당시 한산도 대첩과 명량 대첩을 이끌며 나라를 구한 명장은?",
          options: ["이순신 장군", "을지문덕 장군", "강감찬 장군", "김유신 장군"],
          correctIndex: 0,
          explanation: "충무공 이순신 장군은 거북선과 뛰어난 전술로 왜군을 격퇴하고 바다를 지켰습니다.",
          type: "choice",
          category: "한국 역사"
        },
        {
          question: "신라의 수도였으며 첨성대, 불국사, 석굴암이 있는 유서 깊은 도시는?",
          options: ["경주시", "전주시", "강릉시", "수원시"],
          correctIndex: 0,
          explanation: "경주는 천년 고도 신라의 수도로 수많은 유네스코 세계문화유산을 간직하고 있습니다.",
          type: "choice",
          category: "한국 문화"
        },
        {
          question: "3·1 만세 운동 당시 아우내 장터에서 만세 시위를 주도한 독립운동가는?",
          options: ["유관순 열사", "안중근 의사", "윤봉길 의사", "김구 선생"],
          correctIndex: 0,
          explanation: "유관순 열사는 1919년 천안 아우내 장터에서 태극기를 나누어주며 대한독립만세를 외쳤습니다.",
          type: "choice",
          category: "한국 근현대사"
        },
        {
          question: "우리나라 5대 국경일 중 한글이 반포된 것을 기념하는 날은 10월 9일 한글날이다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "10월 9일은 세종대왕의 훈민정음 반포를 기념하는 자랑스러운 국경일입니다.",
          type: "ox",
          category: "한국 문화"
        },
        {
          question: "조선 왕조의 정궁(제1궁궐)으로 서울 종로에 위치한 궁궐의 이름은?",
          options: ["경복궁", "창덕궁", "덕수궁", "경희궁"],
          correctIndex: 0,
          explanation: "경복궁은 태조 이성계가 조선을 건국하고 가장 먼저 세운 으뜸 궁궐입니다.",
          type: "choice",
          category: "한국 문화"
        },
        {
          question: "우리나라 민요 '아리랑'은 유네스코 인류무형문화유산으로 등재되어 있다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "아리랑은 우리 민족의 정서와 역사를 담은 대표 민요로 2012년 유네스코에 등재되었습니다.",
          type: "ox",
          category: "한국 문화"
        },
        {
          question: "삼국시대 고구려의 전성기를 이끌며 만주벌판까지 영토를 넓힌 왕은?",
          options: ["광개토대왕", "근초고왕", "진흥왕", "의자왕"],
          correctIndex: 0,
          explanation: "광개토대왕은 활발한 정복 활동으로 북방의 광활한 영토를 개척한 정복 군주입니다.",
          type: "choice",
          category: "한국 역사"
        },
        {
          question: "조선시대 정조 임금이 아버지 사도세자를 기리고 상업을 발전시키기 위해 지은 성곽은?",
          options: ["수원 화성", "남한산성", "북한산성", "진주성"],
          correctIndex: 0,
          explanation: "수원 화성은 정조의 효심과 실학자 정약용의 과학적 설계(거중기)로 완성된 계획도시 성곽입니다.",
          type: "choice",
          category: "한국 역사"
        },
        {
          question: "조선시대 백성들의 억울한 사연을 왕에게 직접 알리기 위해 대궐 문에 달아두었던 북은?",
          options: ["신문고", "장구", "징", "소고"],
          correctIndex: 0,
          explanation: "신문고는 태종 때 백성의 억울함을 직접 호소할 수 있도록 궁궐 문루에 설치한 북입니다.",
          type: "choice",
          category: "역사 상식"
        },
        {
          question: "고려시대 몽골의 침략을 부처님의 힘으로 막아내고자 새긴 목판 인쇄물은 팔만대장경이다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "합천 해인사에 보관 중인 팔만대장경판은 뛰어난 판각 기술을 자랑하는 세계문화유산입니다.",
          type: "ox",
          category: "한국 역사"
        },
        {
          question: "조선시대 왕과 왕비의 신주를 모시고 제사를 지내던 사당은?",
          options: ["종묘", "사직단", "성균관", "육조거리"],
          correctIndex: 0,
          explanation: "종묘는 조선 왕조의 역대 왕과 왕비의 제사를 모신 신성한 왕실 사당입니다.",
          type: "choice",
          category: "한국 문화"
        },
        {
          question: "단군할아버지가 우리나라 최초의 국가인 '고조선'을 세운 것을 기념하는 국경일은?",
          options: ["개천절 (10월 3일)", "제헌절 (7월 17일)", "광복절 (8월 15일)", "삼일절 (3월 1일)"],
          correctIndex: 0,
          explanation: "개천절은 '하늘이 열린 날'이라는 뜻으로 기원전 2333년 고조선 건국을 기념합니다.",
          type: "choice",
          category: "한국 문화"
        },
        {
          question: "백범 김구 선생이 대한민국 임시정부 시절 쓴 자서전의 제목은?",
          options: ["백범일지", "난중일기", "징비록", "열하일기"],
          correctIndex: 0,
          explanation: "백범일지는 독립운동의 험난한 여정과 겨레의 소원을 담은 김구 선생의 자서전입니다.",
          type: "choice",
          category: "한국 근현대사"
        },
        {
          question: "독도는 역사적·지리적·국제법적으로 명백한 대한민국의 영토이다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "독도는 대한민국 경상북도 울릉군에 속한 소중하고 아름다운 우리 땅입니다.",
          type: "ox",
          category: "한국 지리"
        }
      ],

      '속담상식': [
        {
          question: "‘말 한마디로 (      ) 빚도 갚는다’는 속담에서 괄호에 들어갈 말은?",
          options: ["천 냥", "백 냥", "만 냥", "십 냥"],
          correctIndex: 0,
          explanation: "말을 조리 있고 정중하게 잘하면 큰 어려움이나 빚도 해결할 수 있다는 뜻입니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘가는 말이 고와야 (      ) 곱다’에 들어갈 알맞은 말은?",
          options: ["오는 말이", "보는 눈이", "듣는 귀가", "주는 떡이"],
          correctIndex: 0,
          explanation: "내가 남에게 먼저 친절하고 좋은 말을 해야 남도 나에게 좋게 대한다는 뜻입니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘발 없는 말이 (      ) 간다’는 소문이 아주 빠르게 퍼짐을 경계하는 속담이다?",
          options: ["천 리", "백 리", "십 리", "만 리"],
          correctIndex: 0,
          explanation: "말은 발이 없어도 순식간에 멀리 퍼지므로 입조심을 늘 해야 한다는 교훈입니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘고래 싸움에 (      ) 등 터진다’에서 괄호에 들어갈 동물은?",
          options: ["새우", "오징어", "멸치", "문어"],
          correctIndex: 0,
          explanation: "강자들끼리 다투는 사이에 힘없는 약자가 엉뚱하게 피해를 입음을 비유합니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘티끌 모아 (      )’는 작은 것도 꾸준히 모으면 큰 것이 된다는 뜻이다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "작은 노력과 저축이 쌓여 큰 결실을 맺음을 뜻하는 대표 속담입니다.",
          type: "ox",
          category: "우리말 속담"
        },
        {
          question: "‘호랑이도 제 말 하면 (      )’이라는 속담의 빈칸은?",
          options: ["온다", "웃는다", "잔다", "도망간다"],
          correctIndex: 0,
          explanation: "남에 대해 이야기하고 있을 때 우연히 그 사람이 나타나는 상황을 이르는 말입니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘낮말은 새가 듣고 밤말은 (      )가 듣는다’에서 밤에 듣는 동물은?",
          options: ["쥐", "소", "개", "말"],
          correctIndex: 0,
          explanation: "아무리 비밀스럽게 한 말이라도 반드시 새어나가므로 항상 말을 조심해야 합니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘원숭이도 나무에서 떨어진다’는 아무리 능숙한 전문가라도 가끔 실수할 수 있음을 뜻한다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "나무를 잘 타는 원숭이도 실수하듯, 누구나 방심하면 실패할 수 있다는 교훈입니다.",
          type: "ox",
          category: "우리말 속담"
        },
        {
          question: "‘백지장도 맞들면 (      )’는 쉬운 일이라도 서로 힘을 합치면 훨씬 쉽다는 뜻이다?",
          options: ["낫다", "무겁다", "찢어진다", "어렵다"],
          correctIndex: 0,
          explanation: "가벼운 종이 한 장도 둘이 함께 들면 낫듯이 협동의 소중함을 말합니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘우물 안 (      )’는 세상 물정을 모르고 좁은 시야에 갇혀 있는 사람을 비유한다?",
          options: ["개구리", "붕어", "송사리", "거북이"],
          correctIndex: 0,
          explanation: "더 넓은 세상을 보지 못하고 자신의 좁은 견해만 고집하는 사람을 뜻합니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘시작이 (      )이다’는 일을 시작하기만 하면 이미 절반은 해낸 것과 같다는 뜻이다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: "첫걸음을 떼는 것이 가장 중요하고 결단력이 필요함을 격려하는 속담입니다.",
          type: "ox",
          category: "우리말 속담"
        },
        {
          question: "‘누워서 떡 먹기’는 어떤 일을 하기가 매우 어렵고 힘들다는 뜻이다?",
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 1,
          explanation: "'누워서 떡 먹기'는 일이 매우 쉽고 수월하다는 반대의 뜻입니다.",
          type: "ox",
          category: "우리말 속담"
        },
        {
          question: "‘금강산도 (      )경’이란 아무리 좋은 구경이라도 배가 불러야 즐겁다는 뜻이다?",
          options: ["식후", "조식", "석식", "야식"],
          correctIndex: 0,
          explanation: "식후경이란 먹는 즐거움과 배부름이 기본이 되어야 주변 경치도 눈에 들어온다는 뜻입니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘바늘 도둑이 (      ) 도둑 된다’는 작은 나쁜 짓도 방치하면 큰 죄가 된다는 경고이다?",
          options: ["소", "금", "말", "닭"],
          correctIndex: 0,
          explanation: "작은 잘못이라도 반성하고 고치지 않으면 나중에 큰 범죄로 이어진다는 교훈입니다.",
          type: "choice",
          category: "우리말 속담"
        },
        {
          question: "‘고생 끝에 (      )이 온다’는 힘든 일을 잘 이겨내면 반드시 기쁜 일이 찾아온다는 뜻이다?",
          options: ["낙 (즐거움)", "돈", "잠", "약"],
          correctIndex: 0,
          explanation: "고진감래(苦盡甘來)와 같은 뜻으로, 인내와 노력 뒤에는 행복이 온다는 격려입니다.",
          type: "choice",
          category: "우리말 속담"
        }
      ]
    };
  }

  // Generate 15 questions and split into 3 pages of 5 questions each
  generateFromTopic(topicKeyword) {
    const cleanTopic = (topicKeyword || '').trim().toLowerCase();
    const bank = QuizGenerator.KNOWLEDGE_BANK;

    let pool = [];

    // Check matching categories
    if (cleanTopic.includes('스마트폰') || cleanTopic.includes('휴대폰') || cleanTopic.includes('폰') || cleanTopic.includes('카톡') || cleanTopic.includes('디지털')) {
      pool = [...bank['스마트폰']];
    } else if (cleanTopic.includes('건강') || cleanTopic.includes('운동') || cleanTopic.includes('음식') || cleanTopic.includes('약') || cleanTopic.includes('병원')) {
      pool = [...bank['건강상식']];
    } else if (cleanTopic.includes('역사') || cleanTopic.includes('문화') || cleanTopic.includes('한국') || cleanTopic.includes('왕') || cleanTopic.includes('조선')) {
      pool = [...bank['역사문화']];
    } else if (cleanTopic.includes('속담') || cleanTopic.includes('우리말') || cleanTopic.includes('사자성어') || cleanTopic.includes('언어')) {
      pool = [...bank['속담상식']];
    } else {
      // General mixed pool or procedural fallback
      pool = [
        ...bank['스마트폰'].slice(0, 5),
        ...bank['건강상식'].slice(0, 5),
        ...bank['역사문화'].slice(0, 5),
        ...bank['속담상식'].slice(0, 5)
      ];

      // Procedurally customize title/category if a custom keyword was entered
      if (cleanTopic.length > 0) {
        pool = this.createProceduralTopicQuestions(cleanTopic, pool);
      }
    }

    // Shuffle pool
    const shuffled = this.shuffleArray([...pool]);

    // Ensure we have at least 15 questions
    while (shuffled.length < 15) {
      shuffled.push(...this.shuffleArray([...pool]));
    }

    const selected15 = shuffled.slice(0, 15);

    // Split into 3 pages of 5 questions each
    this.currentPages = [
      selected15.slice(0, 5),
      selected15.slice(5, 10),
      selected15.slice(10, 15)
    ];

    this.activePageIndex = 0;
    return this.currentPages;
  }

  createProceduralTopicQuestions(topic, basePool) {
    const proceduralSet = [
      {
        question: `[${topic}]에 대해 오늘 수업에서 배운 핵심 내용을 실생활에 적용하는 가장 좋은 방법은?`,
        options: ["가족이나 친구에게 설명해보기", "기억 속에서 잊어버리기", "혼자만 알고 있기", "전혀 사용하지 않기"],
        correctIndex: 0,
        explanation: `배운 ${topic} 지식을 주변 사람들과 대화하고 실천하면 기억에 오래 남습니다.`,
        type: "choice",
        category: topic
      },
      {
        question: `[${topic}]을(를) 학습할 때 의문점이 생기면 강사님께 질문하거나 복습하는 것이 효과적이다?`,
        options: ["그렇다 (O)", "아니다 (X)"],
        correctIndex: 0,
        explanation: `궁금한 점을 바로 질문하고 해결하면 실력이 쑥쑥 자라납니다.`,
        type: "ox",
        category: topic
      },
      {
        question: `[${topic}]과(와) 관련된 정보나 뉴스를 확인할 때 신뢰할 수 있는 공식 출처를 확인하는 것이 중요하다?`,
        options: ["그렇다 (O)", "아니다 (X)"],
        correctIndex: 0,
        explanation: `가짜 정보나 부정확한 내용을 피하기 위해 공인된 기관의 정보를 확인하는 것이 안전합니다.`,
        type: "ox",
        category: topic
      },
      {
        question: `[${topic}] 분야에서 새로운 지식을 익히는 데 가장 중요한 태도는?`,
        options: ["즐거운 마음과 꾸준한 관심", "두려움과 걱정", "포기하는 마음", "남과의 과도한 비교"],
        correctIndex: 0,
        explanation: `나만의 속도로 즐겁게 배움을 이어가는 것이 최고의 학습 비결입니다.`,
        type: "choice",
        category: topic
      },
      {
        question: `오늘 배운 [${topic}] 내용 중 가장 마음에 와닿은 한 가지를 꾸준히 실천하면 큰 변화를 만든다?`,
        options: ["그렇다 (O)", "아니다 (X)"],
        correctIndex: 0,
        explanation: `작은 실천 하나가 쌓여 건강하고 행복한 일상을 만들어 줍니다.`,
        type: "ox",
        category: topic
      }
    ];

    return [...proceduralSet, ...basePool];
  }

  // Parse PPTX / PDF / TXT File
  async parseAndGenerateFromFile(file) {
    const filename = file.name.toLowerCase();
    let extractedText = '';

    if (filename.endsWith('.pptx')) {
      extractedText = await this.extractTextFromPptx(file);
    } else if (filename.endsWith('.pdf')) {
      extractedText = await this.extractTextFromPdf(file);
    } else {
      extractedText = await file.text();
    }

    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("파일에서 충분한 텍스트를 추출할 수 없습니다. 다른 파일을 선택해주세요.");
    }

    return this.generateFromExtractedText(extractedText, file.name);
  }

  // Extract text from PPTX in browser using Zip Decompression
  async extractTextFromPptx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const zipEntries = await this.readZipEntries(arrayBuffer);
    let fullText = '';

    // Look for ppt/slides/slide*.xml
    for (const entry of zipEntries) {
      if (entry.filename.match(/ppt\/slides\/slide\d+\.xml/i)) {
        const xmlText = new TextDecoder('utf-8').decode(entry.data);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const textNodes = xmlDoc.getElementsByTagName('a:t');
        let slideText = '';
        for (let i = 0; i < textNodes.length; i++) {
          slideText += (textNodes[i].textContent || '') + ' ';
        }
        if (slideText.trim()) {
          fullText += `\n[슬라이드] ${slideText.trim()}\n`;
        }
      }
    }

    return fullText;
  }

  // Extract text from PDF in browser (Stream parser)
  async extractTextFromPdf(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = '';
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(bytes);

    // Extract text blocks inside BT ... ET or /Contents
    const textMatches = rawString.match(/\(([^)]+)\)\s*Tj/g) || [];
    for (const m of textMatches) {
      const match = m.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        text += match[1] + ' ';
      }
    }

    // Also look for TJ arrays: [(text) 10 (more)] TJ
    const tjMatches = rawString.match(/\[(.*?)\]\s*TJ/g) || [];
    for (const tj of tjMatches) {
      const parts = tj.match(/\(([^)]+)\)/g) || [];
      for (const p of parts) {
        text += p.replace(/[()]/g, '') + ' ';
      }
    }

    if (!text.trim()) {
      // Fallback: extract clean printable unicode strings
      const cleaned = rawString.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ');
      const words = cleaned.match(/[\uAC00-\uD7A3a-zA-Z0-9.,!?]{2,}/g) || [];
      text = words.slice(0, 300).join(' ');
    }

    return text;
  }

  // Minimal Zip Unpacker using native DecompressionStream
  async readZipEntries(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const entries = [];
    let offset = 0;
    const len = arrayBuffer.byteLength;

    while (offset < len - 30) {
      const sig = dataView.getUint32(offset, true);
      if (sig !== 0x04034b50) break; // Local file header signature

      const compMethod = dataView.getUint16(offset + 8, true);
      const compSize = dataView.getUint32(offset + 18, true);
      const uncompSize = dataView.getUint32(offset + 22, true);
      const nameLen = dataView.getUint16(offset + 26, true);
      const extraLen = dataView.getUint16(offset + 28, true);

      const nameBytes = new Uint8Array(arrayBuffer, offset + 30, nameLen);
      const filename = new TextDecoder().decode(nameBytes);

      const dataOffset = offset + 30 + nameLen + extraLen;
      const compData = new Uint8Array(arrayBuffer, dataOffset, compSize);

      let decompressedData = null;
      if (compMethod === 0) {
        decompressedData = compData;
      } else if (compMethod === 8 && typeof DecompressionStream !== 'undefined') {
        try {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(compData);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          let totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
          decompressedData = new Uint8Array(totalLen);
          let pos = 0;
          for (const c of chunks) {
            decompressedData.set(c, pos);
            pos += c.length;
          }
        } catch (e) {
          // Stream decomp error fallback
        }
      }

      if (decompressedData) {
        entries.push({ filename, data: decompressedData, uncompSize });
      }

      offset = dataOffset + compSize;
    }

    return entries;
  }

  // Generate 15 quiz questions from extracted file text
  generateFromExtractedText(text, docTitle = '강의 자료') {
    // Split into sentences / paragraphs
    const sentences = text
      .split(/[\n.!?]+/)
      .map(s => s.trim().replace(/\s+/g, ' '))
      .filter(s => s.length >= 10 && s.length <= 120);

    const questions = [];

    // Extract key sentences and construct quiz items
    for (let i = 0; i < sentences.length && questions.length < 15; i++) {
      const sent = sentences[i];

      if (i % 2 === 0) {
        // OX Question
        questions.push({
          question: `[${docTitle}] 강의 내용 중: "${sent}" 라는 내용은 올바른 설명이다?`,
          options: ["그렇다 (O)", "아니다 (X)"],
          correctIndex: 0,
          explanation: `강의 자료에 수록된 핵심 내용: "${sent}"`,
          type: "ox",
          category: docTitle
        });
      } else {
        // 4-choice Question
        // Pick words to make distractors
        const words = sent.split(' ').filter(w => w.length >= 2);
        const keyword = words[Math.floor(words.length / 2)] || "핵심 내용";

        questions.push({
          question: `[${docTitle}] 학습 내용에서 강조한 다음 문장의 핵심 키워드는 무엇일까요?\n▶ "${sent}"`,
          options: [
            keyword,
            "전혀 관련 없는 내용",
            "반대되는 개념",
            "잘못된 상식"
          ],
          correctIndex: 0,
          explanation: `본문에서 다룬 중요 포인트는 '${keyword}'입니다.`,
          type: "choice",
          category: docTitle
        });
      }
    }

    // If text was short, fill with rich general knowledge bank questions
    const fallbackBank = QuizGenerator.KNOWLEDGE_BANK['스마트폰'];
    let idx = 0;
    while (questions.length < 15) {
      questions.push(fallbackBank[idx % fallbackBank.length]);
      idx++;
    }

    const shuffled = this.shuffleArray(questions).slice(0, 15);

    this.currentPages = [
      shuffled.slice(0, 5),
      shuffled.slice(5, 10),
      shuffled.slice(10, 15)
    ];

    this.activePageIndex = 0;
    return this.currentPages;
  }

  // Get active 5-question page set
  getActivePageQuestions() {
    return this.currentPages[this.activePageIndex] || [];
  }

  setActivePage(pageIndex) {
    if (pageIndex >= 0 && pageIndex < 3) {
      this.activePageIndex = pageIndex;
    }
    return this.getActivePageQuestions();
  }

  // Helper: Fisher-Yates Array Shuffle
  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

window.QuizGenerator = QuizGenerator;
