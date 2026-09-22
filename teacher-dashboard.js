(() => {
  const platform = window.StoriesLensPlatform;
  const projectList = document.querySelector("[data-teacher-project-list]");
  if (!platform || !projectList) return;

  const locale = () => window.StoriesLensI18n?.locale === "zh" || localStorage.getItem("storieslens_locale") === "zh" ? "zh" : "en";
  const say = (en, zh) => locale() === "zh" ? zh : en;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  function renderProjects(projects) {
    projectList.replaceChildren();
    const classroomProjects = projects.filter((project) => project.mode === "classroom");
    if (!classroomProjects.length) {
      projectList.append(node("p", "", say("No cloud classroom projects yet. Create a free local proof to begin.", "还没有云端班级项目，可以先免费制作本机预览。")));
      return;
    }
    classroomProjects.slice(0, 9).forEach((project) => {
      const card = node("article", "teacher-project-item");
      const metadata = project.clientSnapshot?.teacherPublisher || {};
      const updated = new Intl.DateTimeFormat(locale() === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(project.updatedAt));
      const link = node("a", "", say("Open teacher project →", "打开教师项目 →"));
      link.href = `classroom-archive.html?project=${encodeURIComponent(project.id)}`;
      card.append(
        node("span", "teacher-account-label", metadata.edition || say("CLASS BOOK", "班级作品集")),
        node("h4", "", project.title),
        node("p", "", `${metadata.classLabel || say("Private class collection", "私密班级作品集")} · ${metadata.pageCount || project.scenes?.length || 0} ${say("pages", "页")} · ${updated}`),
        link
      );
      projectList.append(card);
    });
  }

  async function loadTeacherDesk() {
    const sessionCopy = document.querySelector("[data-teacher-session]");
    const loginLink = document.querySelector("[data-teacher-login]");
    try {
      const session = await platform.getSession();
      if (!session.authenticated) {
        sessionCopy.textContent = say("Sign in with the adult-owned teacher account to save and share across devices.", "请使用教师本人持有的成年人账户登录，以跨设备保存和分享。" );
        return;
      }
      loginLink.hidden = true;
      sessionCopy.textContent = say(`Signed in as ${session.user.displayName}. Projects stay private until you invite families.`, `已登录：${session.user.displayName}。只有教师创建邀请后，家庭才能查看。`);
      const [credits, projects] = await Promise.all([platform.api("/api/credits"), platform.api("/api/projects")]);
      const classroom = credits.wallet.resources.classroomProjects;
      const studentWorks = credits.wallet.resources.studentWorks;
      document.querySelector("[data-classroom-remaining]").textContent = String(classroom.remaining);
      document.querySelector("[data-classroom-copy]").textContent = say(`${classroom.consumed} used · ${classroom.granted} total`, `已用${classroom.consumed} · 共${classroom.granted}`);
      document.querySelector("[data-student-works-remaining]").textContent = String(studentWorks.remaining);
      renderProjects(projects.projects);
    } catch (error) {
      sessionCopy.textContent = error.message || say("The teacher workspace could not load.", "暂时无法载入教师工作台。" );
    }
  }

  loadTeacherDesk();
  window.addEventListener("storieslens:locale", loadTeacherDesk);
})();
