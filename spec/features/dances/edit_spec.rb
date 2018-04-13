# coding: utf-8
require 'rails_helper'
require 'login_helper'

describe 'Editing dances', js: true do
  it 'displays attributes of an existing dance' do
    with_login do |user|
      dance = FactoryGirl.create(:box_the_gnat_contra, user: user)
      visit edit_dance_path dance.id
      expect(page.body).to include(dance.title)
      expect(page.body).to include(dance.choreographer.name)
      expect(page.body).to include(dance.start_type)
      expect(page.body).to include(dance.hook)
      expect(page.body).to include(dance.preamble)
      expect(page.body).to_not match(/Becket/i)
      expect(page).to have_text('neighbors balance & swing')
      expect(page).to have_text('ladles allemande right 1½')
      expect(page.body).to include dance.notes
      expect(page).to have_current_path(edit_dance_path(dance.id))
    end
  end

  it 'editing a dance passes it\'s information through unchanged' do
    with_login do |user|
      choreographer = FactoryGirl.create(:choreographer, name: 'Becky Hill')
      dance1 = FactoryGirl.create(:box_the_gnat_contra, user: user, choreographer: choreographer)
      visit edit_dance_path dance1.id
      click_button 'Save Dance'
      dance2 = FactoryGirl.build(:box_the_gnat_contra, user: user, choreographer: choreographer)
      dance1.reload
      expect(current_path).to eq dance_path dance1.id
      %w[title start_type figures_json hook preamble notes].each do |message|
        expect(dance1.send message).to eql dance2.send message
      end
      expect(dance1.choreographer.name).to eql dance2.choreographer.name
    end
  end

  it 'editing a dance saves form values (except figure editor edits)' do
    with_login do |user|
      dance = FactoryGirl.create(:box_the_gnat_contra, user: user)
      visit edit_dance_path dance.id
      fill_in 'dance_title', with: 'Call Me'
      fill_in 'dance[choreographer_name]', with: 'Cary Ravitz'
      fill_in 'dance[start_type]', with: 'Beckett'
      fill_in 'dance[hook]', with: 'wombatty'
      fill_in 'dance[preamble]', with: 'prerambling'
      fill_in 'dance[notes]', with: 'notey'
      choose 'Publish'
      click_button 'Save Dance'
      dance.reload

      expect(dance.title).to eq('Call Me')
      expect(dance.choreographer.name).to eq('Cary Ravitz')
      expect(dance.start_type).to eq('Beckett')
      expect(dance.hook).to eq('wombatty')
      expect(dance.preamble).to eq('prerambling')
      expect(dance.notes).to eq('notey')
    end
  end

  it 'figure inputs prefill' do
    with_login do |user|
      dance = FactoryGirl.create(:box_the_gnat_contra, user: user)

      # give the swing a note
      figures = dance.figures
      figures[2]['note'] = 'this is a swing'
      dance.update!(figures: figures)

      visit edit_dance_path dance.id
      click_on('figure-2')

      # why 'swing:string' and not 'swing'? Must be some angular thing
      expect(find('#move-2').value).to eq('string:swing')

      figure_value_setters = find_all('.figure-value-setter-div')
      expect(figure_value_setters.length).to eq(5)

      _move, who, prefix, beats, note = figure_value_setters.to_a
      expect(who.find('select').value).to eq('string:neighbors')
      expect(prefix.find("input[value=none]")).to_not be_checked
      expect(prefix.find("input[value=balance]")).to be_checked
      expect(prefix.find("input[value=meltdown]")).to_not be_checked
      expect(beats.find('select').value).to eq('number:16')
      expect(note.find('input').value).to eq('this is a swing')
    end
  end

  it 'figure inputs save' do
    with_login do |user|
      dance = FactoryGirl.create(:box_the_gnat_contra, user: user)

      visit edit_dance_path dance.id
      click_on('figure-6')

      select 'swing', match: :first
      select 'neighbors'
      choose 'meltdown'
      fill_in 'note', with: 'with gusto!'

      click_button 'Save Dance'

      dance.reload

      copy = FactoryGirl.build(:box_the_gnat_contra)
      expect(dance.figures.length).to eq(copy.figures.length)
      expect(dance.figures[0,6]).to eq(copy.figures[0,6])
      expect(dance.figures[6]).to eq({'move' => 'swing', 'parameter_values' => ['neighbors', 'meltdown', 16], 'note' => 'with gusto!'})
    end
  end

  describe 'dynamic shadow/1st shadow and next neighbor/2nd neighbor behavior' do
    it 'rewrites figure texts' do
      with_login do |user|
        dance = FactoryGirl.create(:dance_with_all_shadows_and_neighbors, user: user)
        visit edit_dance_path dance.id
        expect(page).to_not have_content('next neighbors')
        expect(page).to have_content('2nd neighbors')
        expect(page).to have_content('B2 1st shadows swing')
        click_link('3rd neighbors swing')
        select('partners')
        expect(page).to have_content('next neighbors')
        expect(page).to_not have_content('2nd neighbors')
        click_link('2nd shadows swing')
        select('partners')
        expect(page).to_not have_content('B2 1st shadows swing')
        expect(page).to have_content('B2 shadows swing')
        select('2nd shadows')
        expect(page).to have_content('B2 1st shadows swing')
      end
    end

    it 'has dynamic dancer menus' do
      with_login do |user|
        dance = FactoryGirl.create(:dance_with_all_shadows_and_neighbors, user: user)
        visit edit_dance_path dance.id
        click_link('3rd neighbors swing')
        expect(page).to_not have_css('option', text: 'next neighbors')
        expect(page).to have_css('option', text: '2nd neighbors')
        select('partners')
        expect(page).to have_css('option', text: 'next neighbors')
        expect(page).to_not have_css('option', text: '2nd neighbors')
        click_link('2nd shadows swing')
        expect(page).to have_css('option', text: '1st shadows')
        expect(page).to_not have_css('option', text: /\Ashadows\z/)
        select('partners')
        expect(page).to_not have_css('option', text: '1st shadows')
        expect(page).to have_css('option', text: /\Ashadows\z/)
      end
    end
  end

  it 'custom moves and move notes update dynamically for dialect' do
    with_login do |user|
      custom_text = 'custom allemande gentlespoons custom'
      custom_text_in_dialect = 'custom almond larks custom'
      dance = FactoryGirl.create(:dance_with_a_custom, custom_text: custom_text, user: user)
      allow_any_instance_of(User).to receive(:dialect).and_return(JSLibFigure.test_dialect)
      visit edit_dance_path dance.id
      expect(page).to have_content(custom_text_in_dialect)
      expect(page).to_not have_content(custom_text)
      click_on(custom_text_in_dialect)
      fill_in('note', with: 'note gyre ladles note')
      expect(page).to have_content('note darcy ravens note')
      fill_in('custom', with: 'custom first gentlespoon custom')
      expect(page).to have_content('custom first lark custom')
    end
  end
end
